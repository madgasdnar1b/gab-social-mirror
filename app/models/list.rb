# frozen_string_literal: true
# == Schema Information
#
# Table name: lists
#
#  id               :bigint(8)        not null, primary key
#  account_id       :bigint(8)        not null
#  title            :string           default(""), not null
#  created_at       :datetime         not null
#  updated_at       :datetime         not null
#  visibility       :integer          default("private"), not null
#  subscriber_count :integer          default(0), not null
#  slug             :string
#  order            :integer
#  is_featured      :boolean
#

class List < ApplicationRecord
  include Paginable
  include ListInteractions

  PER_ACCOUNT_LIMIT = 100

  belongs_to :account, optional: true

  enum visibility: [
    :private, # [default] only creator can view
    :public, # anyone can view, visible in profile
    # :unlisted, # anyone can view, not visible in profile
    # :limited, # only followers can view
  ], _suffix: :visibility

  has_many :list_accounts, inverse_of: :list, dependent: :destroy
  has_many :accounts, through: :list_accounts

  has_many :list_subscribers, inverse_of: :list, dependent: :destroy
  has_many :subscribers, source: :account, through: :list_subscribers

  has_many :list_removed_accounts, inverse_of: :list, dependent: :destroy
  has_many :removed_accounts, source: :account, through: :list_removed_accounts

  scope :recent, -> { reorder(id: :desc) }
  scope :alphabetical, -> { order(arel_table['title'].lower.asc) }
  scope :public_only, -> { where(visibility: :public) }
  scope :is_featured, -> { where(is_featured: :true) }

  scope :is_member, ->(accountId) { left_outer_joins(:list_accounts).where('list_accounts.account_id=?', accountId) }
  scope :is_subscriber, ->(accountId) { left_outer_joins(:list_subscribers).where('list_subscribers.account_id=?', accountId) }

  validates :title, presence: true

  validates_each :account_id, on: :create do |record, _attr, value|
    record.errors.add(:base, I18n.t('lists.errors.limit')) if List.where(account_id: value).count >= PER_ACCOUNT_LIMIT
  end

  before_destroy :clean_feed_manager

  class << self
    SEARCH_FIELDS = %i[title].freeze

    def search_for(term, offset = 0, limit = 25)
      SEARCH_FIELDS.inject(none) { |r, f| r.or(matching(f, :contains, term)) }
        .public_only
        .order(
          updated_at: :desc,
          is_featured: :desc,
        )
        .limit(limit)
        .offset(offset)
    end
  end

  def cache_key
    "lists/#{id}-#{cache_version}"
  end

  private

  def clean_feed_manager
    Redis.current.with do |conn|
      reblog_key       = FeedManager.instance.key(:list, id, 'reblogs')
      reblogged_id_set = conn.zrange(reblog_key, 0, -1)

      conn.pipelined do
        conn.del(FeedManager.instance.key(:list, id))
        conn.del(reblog_key)

        reblogged_id_set.each do |reblogged_id|
          reblog_set_key = FeedManager.instance.key(:list, id, "reblogs:#{reblogged_id}")
          conn.del(reblog_set_key)
        end
      end
    end
  end
end
