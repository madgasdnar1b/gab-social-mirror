import React from 'react'
import PropTypes from 'prop-types'
import ImmutablePropTypes from 'react-immutable-proptypes'
import ImmutablePureComponent from 'react-immutable-pure-component'
import { CX } from '../constants'
import ReactionTypeImage from './reaction_type_image'
import Text from './text'
import { allReactions } from '../initial_state'
import { shortNumberFormat } from "../utils/numbers";

class ReactionsDisplayBlock extends ImmutablePureComponent {

  getTheTitle = () => {
    const {
      isBasicText,
      totalCount,
      reactions,
      showText,
    } = this.props

    const count = reactions.size
    if (!showText || count === 0) return ''

    const formattedNumber = shortNumberFormat(totalCount)
    if (isBasicText) return formattedNumber

    const firstReaction = reactions.get(0)
    const firstReactionCount = firstReaction.get('count')
    const firstReact = this.getReaction(firstReaction.get('reactionId'))
    const { name, name_plural } = (firstReact || {})

    if (count === 1 && firstReactionCount === 1) {
      // has only ONE reaction type with only ONE reaction with it
      // e.g. '1 dislike' --- (it's singular)
      return <>{formattedNumber} {name.toLowerCase()}</>
    } else if (count === 1 && firstReactionCount > 1) {
      // has only ONE reaction type but MANY reactions with that type
      // e.g. '2 dislikes' --- (it's plural)
      return <>{formattedNumber} {name_plural.toLowerCase()}</>
    }
    // else, has many reactions with varying counts per reaction
    // e.g. '5 reactions'
    return <>{formattedNumber} reactions</>
  }

  getReaction(id) {
    return allReactions.find(r => r.id == id)
  }

  render () {
    const {
      isBasicText,
      isDisabled,
      reactions,
      totalCount,
      onClick,
      showIcons,
      showText,
      iconSize,
      textSize,
      textColor,
    } = this.props

    if (!reactions) return null
    
    const count = reactions.size
    if (count === 0) return null

    const hasIcons = count > 0 && showIcons

    const likeBtnClasses = CX({
      d: 1,
      fw400: 1,
      noUnderline: 1,
      bgTransparent: 1,
      noSelect: 1,
      cursorPointer: !isDisabled,
      cursorNotAllowed: isDisabled,
      underline_onHover: !isDisabled,
      flexRow: hasIcons,
      jcCenter: hasIcons,
    })

    const iconContainerClasses = CX({
      d: 1,
      flexRow: 1,
      mr5: count > 1 || showText
    })

    const text = this.getTheTitle()

    return (
      <button
        className={likeBtnClasses}
        onClick={onClick}
        disabled={isDisabled}
      >
        {
          hasIcons && 
          <div className={iconContainerClasses}>
            {
              reactions.splice(Math.min(3, count)).map((block) => (
                <div
                  key={`reaction-${block.get('reactionId')}`}
                  className={_s.d}
                >
                  <ReactionTypeImage reactionTypeId={block.get('reactionId')} size={iconSize} />
                </div>
              ))
            }
          </div>
        }
        {
          !!showText &&
          <Text color={textColor} size={textSize} className={hasIcons ? _s.ml2 : undefined}>
            {text}
          </Text>
        }
      </button>
    )
  }

}

ReactionsDisplayBlock.propTypes = {
  isBasicText: PropTypes.bool,
  isDisabled: PropTypes.bool,
  onClick: PropTypes.func,
  reactions: ImmutablePropTypes.map,
  showIcons: PropTypes.bool,
  showText: PropTypes.bool,
  size: PropTypes.string,
  totalCount: PropTypes.number,
  textSize: PropTypes.string,
  textColor: PropTypes.string,
}

ReactionsDisplayBlock.defaultProps = {
  textSize: 'small',
  textColor: 'secondary',
}

export default ReactionsDisplayBlock
