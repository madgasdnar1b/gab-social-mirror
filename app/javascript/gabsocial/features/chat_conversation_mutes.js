import React from 'react'
import PropTypes from 'prop-types'
import BlockHeading from '../components/block_heading'
import ChatConversationsList from './messages/components/chat_conversations_list'

class ChatConversationMutes extends React.PureComponent {

  render() {
    return (
      <div className={[_s.d, _s.w100PC, _s.boxShadowNone].join(' ')}>
        <div className={[_s.d, _s.h60PX, _s.w100PC, _s.px10, _s.py10, _s.borderBottom1PX, _s.borderColorSecondary].join(' ')}>
          <BlockHeading title={'Muted Chat Conversations'} />
        </div>
        <ChatConversationsList source='mutes' />
      </div>
    )
  }

}

export default ChatConversationMutes