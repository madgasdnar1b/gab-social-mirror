import {
  NOTIFICATIONS_UPDATE,
  NOTIFICATIONS_EXPAND_SUCCESS,
  NOTIFICATIONS_EXPAND_REQUEST,
  NOTIFICATIONS_EXPAND_FAIL,
  NOTIFICATIONS_FILTER_SET,
  NOTIFICATIONS_CLEAR,
  NOTIFICATIONS_SCROLL_TOP,
  NOTIFICATIONS_UPDATE_QUEUE,
  NOTIFICATIONS_DEQUEUE,
  MAX_QUEUED_NOTIFICATIONS,
  NOTIFICATIONS_MARK_READ,
} from '../actions/notifications'
import {
  ACCOUNT_BLOCK_SUCCESS,
  ACCOUNT_MUTE_SUCCESS,
} from '../actions/accounts'
import { Range, Map as ImmutableMap, List as ImmutableList } from 'immutable'
import get from 'lodash.get'
import { unreadCount } from '../initial_state'
import compareId from '../utils/compare_id';

const DEFAULT_NOTIFICATIONS_LIMIT = 20

const initialState = ImmutableMap({
  items: ImmutableList(),
  sortedItems: ImmutableList(),
  lastId: null,
  hasMore: true,
  top: false,
  unread: unreadCount || 0,
  isLoading: false,
  isError: false,
  queuedNotifications: ImmutableList(), //max = MAX_QUEUED_NOTIFICATIONS
  totalQueuedNotificationsCount: 0, //used for queuedItems overflow for MAX_QUEUED_NOTIFICATIONS+
  filter: ImmutableMap({
    active: 'all',
    onlyVerified: false,
    onlyFollowing: false,
  }),
});

const notificationToMap = (notification) => ImmutableMap({
  id: notification.id,
  type: notification.type,
  account: notification.account.id,
  created_at: notification.created_at,
  reaction_id: notification.favourite && notification.favourite.reaction_id ? notification.favourite.reaction_id : null,
  status: notification.status ? notification.status.id : null,
  group_id: notification.group_moderation_event ? notification.group_moderation_event.group_id : null,
  approved: notification.group_moderation_event ? notification.group_moderation_event.approved : null,
  rejected: notification.group_moderation_event ? notification.group_moderation_event.rejected : null,
  removed: notification.group_moderation_event ? notification.group_moderation_event.removed : null,
  group_name: notification.group_moderation_event ? notification.group_moderation_event.group_name : null,
});

const makeSortedNotifications = (state) => {
  let finalSortedItems = ImmutableList()
  const items = state.get('items')

  const chunks = Range(0, items.count(), DEFAULT_NOTIFICATIONS_LIMIT)
    .map((chunkStart) => items.slice(chunkStart, chunkStart + DEFAULT_NOTIFICATIONS_LIMIT)) 
  
  chunks.forEach((chunk) => {
    let sortedItems = ImmutableList()

    let follows = ImmutableList()

    // schema: likes [statusId] [reactionTypeId]
    let likes = {}
    let reposts = {}
  
    let followIndex = -1
    let indexesForStatusesForReposts = {}
    let indexesForStatusesForFavorites = {}

    chunk.forEach((notification) => {
      if (!!notification) {
        const statusId = notification.get('status')
        const type = notification.get('type')

        switch (type) {
          case 'follow': {
            if (followIndex === -1) followIndex = sortedItems.size
            sortedItems = sortedItems.set(followIndex, ImmutableMap())
            follows = follows.set(follows.size, notification)
            break
          }
          case 'favourite': {
            let reactionTypeId = notification.get('reaction_id')

            if (likes[statusId] === undefined) {
              // init outer
              likes[statusId] = {}
              indexesForStatusesForFavorites[statusId] = {}
            }
            if (likes[statusId][reactionTypeId] === undefined) {
              // init inner
              likes[statusId][reactionTypeId] = []

              let size = sortedItems.size
              sortedItems = sortedItems.set(size, ImmutableMap())
              indexesForStatusesForFavorites[statusId][reactionTypeId] = size
            }

            likes[statusId][reactionTypeId].push({
              account: notification.get('account'),
              created_at: notification.get('created_at'),
              id: notification.get('id'),
              reaction_id: reactionTypeId,
            })
            break
          }
          case 'reblog': {
            if (reposts[statusId] === undefined) {
              let size = sortedItems.size
              sortedItems = sortedItems.set(size, ImmutableMap())
              indexesForStatusesForReposts[statusId] = size
              reposts[statusId] = []
            }
            reposts[statusId].push({
              account: notification.get('account'),
              created_at: notification.get('created_at'),
              id: notification.get('id'),
            })
            break
          }
          default: {
            sortedItems = sortedItems.set(sortedItems.size, notification)
            break
          }
        }

        if (follows.size > 0) {
          sortedItems = sortedItems.set(followIndex, ImmutableMap({
            follow: follows,
          }))
        }

        if (Object.keys(likes).length > 0) {
          for (const statusId in likes) {
            for (const reactionTypeId in likes[statusId]) {
              const likeArr = likes[statusId][reactionTypeId]
              const accounts = likeArr.map((l) => l.account)
              const lastUpdated = likeArr[0]['created_at']

              sortedItems = sortedItems.set(indexesForStatusesForFavorites[statusId][reactionTypeId], ImmutableMap({
                like: ImmutableMap({
                  accounts,
                  lastUpdated,
                  reactionTypeId,
                  status: statusId,
                })
              }))
            }
          }
        }
        if (Object.keys(reposts).length > 0) {
          for (const statusId in reposts) {
            if (reposts.hasOwnProperty(statusId)) {
              const repostArr = reposts[statusId]
              const accounts = repostArr.map((l) => l.account)
              const lastUpdated = repostArr[0]['created_at']

              sortedItems = sortedItems.set(indexesForStatusesForReposts[statusId], ImmutableMap({
                repost: ImmutableMap({
                  accounts,
                  lastUpdated,
                  status: statusId,
                })
              }))
            }
          }
        }
      }
    })

    if (sortedItems.size > 0) finalSortedItems = finalSortedItems.concat(sortedItems)
  })

  return state.set('sortedItems', finalSortedItems)
}

const normalizeNotification = (state, notification) => {
  state = state.update('items', (list) => {
    return list.unshift(notificationToMap(notification))
  })

  return makeSortedNotifications(state)
}

const expandNormalizedNotifications = (state, action) => {
  const { notifications, next, operation } = action
  let items = ImmutableList()

  notifications.forEach((n, i) => {
    const noti = notificationToMap(n)
    if (!!noti) items = items.set(items.size, noti)
  })

  state = state.withMutations((mutable) => {
    if (!items.isEmpty()) {
      mutable.update('items', (list) => {
        const lastIndex = 1 + list.findLastIndex(
          item => item !== null && (compareId(item.get('id'), items.last().get('id')) > 0 || item.get('id') === items.last().get('id'))
        )

        const firstIndex = 1 + list.take(lastIndex).findLastIndex(
          item => item !== null && compareId(item.get('id'), items.first().get('id')) > 0
        )

        return list.take(firstIndex).concat(items, list.skip(lastIndex))
      })
    }

    if (!next && operation === 'load-next') mutable.set('hasMore', false)
    mutable.set('isLoading', false)
  })

  return makeSortedNotifications(state)
}

const updateTop = (state, top) => {
  return state.withMutations((mutable) => {
    if (top) mutable.set('unread', 0)
    mutable.set('top', top)
  })
}

const filterNotifications = (state, relationship) => {
  const filterer = (list) => list.filterNot((item) => !!item && item.get('account') === relationship.id)
  state = state.update('items', filterer)
  return makeSortedNotifications(state)
}

const deleteByStatus = (state, statusId) => {
  const filterer = (list) => list.filterNot((item) => !!item && item.get('status') === statusId)
  state = state.update('items', filterer)
  return makeSortedNotifications(state)
}

const updateNotificationsQueue = (state, notification, intlMessages, intlLocale) => {
  const queuedNotifications = state.getIn(['queuedNotifications'], ImmutableList());
  const listedNotifications = state.getIn(['items'], ImmutableList());
  const totalQueuedNotificationsCount = state.getIn(['totalQueuedNotificationsCount'], 0);
  const unread = state.getIn(['unread'], 0)

  let alreadyExists = queuedNotifications.find((existingQueuedNotification) => existingQueuedNotification.id === notification.id);
  if (!alreadyExists) {
    alreadyExists = listedNotifications.find((existingListedNotification) => existingListedNotification.get('id') === notification.id);
  }
  if (alreadyExists) {
    return state;
  }

  let newQueuedNotifications = queuedNotifications;

  return state.withMutations(mutable => {
    if (totalQueuedNotificationsCount <= MAX_QUEUED_NOTIFICATIONS) {
      mutable.set('queuedNotifications', newQueuedNotifications.push({
        notification,
        intlMessages,
        intlLocale,
      }));
    }
    mutable.set('totalQueuedNotificationsCount', totalQueuedNotificationsCount + 1);
    mutable.set('unread', unread + 1);
  });
};

export default function notifications(state = initialState, action) {
  switch(action.type) {
  case NOTIFICATIONS_EXPAND_REQUEST:
    return state.set('isLoading', true);
  case NOTIFICATIONS_EXPAND_FAIL:
    return state.withMutations(mutable => {
      mutable.set('isLoading', false)
      mutable.set('isError', true)
    })
  case NOTIFICATIONS_FILTER_SET:
    return state.withMutations(mutable => {
      mutable.set('items', ImmutableList()).set('hasMore', true)
      mutable.setIn(['filter', action.path], action.value)
    })
  case NOTIFICATIONS_SCROLL_TOP:
    return updateTop(state, action.top);
  case NOTIFICATIONS_UPDATE:
    state = state.set('unread', state.get('unread') + 1);
    return normalizeNotification(state, action.notification);
  case NOTIFICATIONS_UPDATE_QUEUE:
    return updateNotificationsQueue(state, action.notification, action.intlMessages, action.intlLocale);
  case NOTIFICATIONS_MARK_READ:
    return state.set('unread', 0);    
  case NOTIFICATIONS_DEQUEUE:
    return state.withMutations(mutable => {
      mutable.set('queuedNotifications', ImmutableList())
      mutable.set('totalQueuedNotificationsCount', 0)
      mutable.set('unread', 0)
    });
  case NOTIFICATIONS_EXPAND_SUCCESS:
    return expandNormalizedNotifications(state.set('unread', 0), action);
  case ACCOUNT_BLOCK_SUCCESS:
    return filterNotifications(state, action.relationship);
  case ACCOUNT_MUTE_SUCCESS:
    return action.relationship.muting_notifications ? filterNotifications(state, action.relationship) : state;
  case NOTIFICATIONS_CLEAR:
    state = initialState
    return state.withMutations(mutable => {
      mutable.set('unread', 0)
    });
  default:
    return state;
  }
};
