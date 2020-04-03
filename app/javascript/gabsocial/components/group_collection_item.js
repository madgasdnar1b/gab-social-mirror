import ImmutablePropTypes from 'react-immutable-proptypes'
import ImmutablePureComponent from 'react-immutable-pure-component'
import { Fragment } from 'react'
import { NavLink } from 'react-router-dom'
import { defineMessages, injectIntl } from 'react-intl'
import classNames from 'classnames/bind'
import { shortNumberFormat } from '../utils/numbers'
import Button from './button'
import DotTextSeperator from './dot_text_seperator'
import Image from './image'
import Text from './text'

const messages = defineMessages({
  members: { id: 'groups.card.members', defaultMessage: 'Members' },
  new_statuses: { id: 'groups.sidebar-panel.item.view', defaultMessage: 'new gabs' },
  no_recent_activity: { id: 'groups.sidebar-panel.item.no_recent_activity', defaultMessage: 'No recent activity' },
  viewGroup: { id: 'view_group', defaultMessage: 'View Group' },
  member: { id: 'member', defaultMessage: 'Member' },
  admin: { id: 'admin', defaultMessage: 'Admin' },
})

const mapStateToProps = (state, { id }) => ({
  group: state.getIn(['groups', id]),
  relationships: state.getIn(['group_relationships', id]),
})

const cx = classNames.bind(_s)

export default
@connect(mapStateToProps)
@injectIntl
class GroupCollectionItem extends ImmutablePureComponent {
  static propTypes = {
    group: ImmutablePropTypes.map,
    relationships: ImmutablePropTypes.map,
  }

  render() {
    const { intl, group, relationships } = this.props

    if (!relationships) return null

    const unreadCount = relationships.get('unread_count')

    const subtitle = unreadCount > 0 ? (
      <Fragment>
        {shortNumberFormat(unreadCount)}
        &nbsp;
        {intl.formatMessage(messages.new_statuses)}
      </Fragment>
    ) : intl.formatMessage(messages.no_recent_activity)

    const imageHeight = '180px'

    const isMember = relationships.get('member')

    const outsideClasses = cx({
      default: 1,
      width50PC: 1,
    })

    const navLinkClasses = cx({
      default: 1,
      noUnderline: 1,
      overflowHidden: 1,
      borderColorSecondary: 1,
      radiusSmall: 1,
      border1PX: 1,
      mb10: 1,
      ml5: 1,
      mr5: 1,
      backgroundColorPrimary: 1,
      backgroundSubtle_onHover: isMember,
    })

    return (
      <div className={outsideClasses}>
        <NavLink
          to={`/groups/${group.get('id')}`}
          className={navLinkClasses}
        >
          <Image
            src={group.get('cover')}
            alt={group.get('title')}
            height={imageHeight}
          />

          <div className={[_s.default, _s.flexRow, _s.positionAbsolute, _s.top0, _s.right0, _s.pt10, _s.mr10].join(' ')}>
            <Text
              badge
              className={_s.backgroundColorWhite}
              size='extraSmall'
              color='brand'
            >
              {intl.formatMessage(messages.member)}
            </Text>
            <Text
              badge
              className={[_s.backgroundColorBlack, _s.ml5].join(' ')}
              size='extraSmall'
              color='white'
            >
              {intl.formatMessage(messages.admin)}
            </Text>
          </div>

          <div className={[_s.default, _s.px10, _s.my10].join(' ')}>
            <Text color='primary' size='medium' weight='bold'>
              {group.get('title')}
            </Text>

            <div className={[_s.default, _s.flexRow, _s.alignItemsCenter, _s.my5].join(' ')}>
              <Text color='secondary' size='small'>
                {shortNumberFormat(group.get('member_count'))}
                &nbsp;
              {intl.formatMessage(messages.members)}
              </Text>
              <DotTextSeperator />
              <Text color='secondary' size='small' className={_s.ml5}>
                {subtitle}
              </Text>
              <DotTextSeperator />
              <Text color='secondary' size='small' className={_s.ml5}>→</Text>
            </div>
          </div>

        </NavLink>
      </div>
    )
  }
}