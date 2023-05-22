# frozen_string_literal: true
# == Schema Information
#
# Table name: session_activations
#
#  id                       :bigint(8)        not null, primary key
#  session_id               :string           not null
#  created_at               :datetime         not null
#  updated_at               :datetime         not null
#  user_agent               :string           default(""), not null
#  ip                       :inet
#  access_token_id          :bigint(8)
#  user_id                  :bigint(8)        not null
#  web_push_subscription_id :bigint(8)
#

class SessionActivation < ApplicationRecord
  belongs_to :user, inverse_of: :session_activations
  belongs_to :access_token, class_name: 'Doorkeeper::AccessToken', dependent: :destroy, optional: true
  belongs_to :web_push_subscription, class_name: 'Web::PushSubscription', dependent: :destroy, optional: true

  delegate :token,
           to: :access_token,
           allow_nil: true

  scope :recent, -> { reorder(created_at: :desc) }

  def detection
    @detection ||= Browser.new(user_agent)
  end

  def browser
    detection.id
  end

  def platform
    detection.platform.id
  end

  before_create :assign_access_token
  before_save   :assign_user_agent

  class << self
    def active?(id)
      ActiveRecord::Base.connected_to(role: :writing) do
        id && where(session_id: id).exists?
      end
    end

    def activate(**options)
      activation = nil
      ActiveRecord::Base.connected_to(role: :writing) do
        SessionActivation.record_timestamps = true
        activation = create!(options)
        purge_old
        SessionActivation.record_timestamps = false
      end
      activation
    end

    def deactivate(id)
      return unless id

      Redis.current.publish("altstream:main", Oj.dump(event: :session_deactivation, payload: { session_id: id.to_s }))

      ActiveRecord::Base.connected_to(role: :writing) do
        where(session_id: id).each do |session|
          DoorkeeperTokenCache.delete(session.token)
          session.destroy
        end
      end
    end

    def purge_old
      order('created_at desc').offset(Rails.configuration.x.max_session_activations).destroy_all
    end

    #def exclusive(id)
    #  where('session_id != ?', id).destroy_all
    #end
  end

  private

  def assign_user_agent
    self.user_agent = '' if user_agent.nil?
  end

  def assign_access_token
    ActiveRecord::Base.connected_to(role: :writing) do

      superapp = Doorkeeper::Application.find_by(superapp: true)

      self.access_token = Doorkeeper::AccessToken.create!(application_id: superapp&.id,
                                                          resource_owner_id: user_id,
                                                          scopes: 'read write follow',
                                                          expires_in: Doorkeeper.configuration.access_token_expires_in,
                                                          use_refresh_token: Doorkeeper.configuration.refresh_token_enabled?)

      DoorkeeperTokenCache.write(token, access_token)
    end
  end
end
