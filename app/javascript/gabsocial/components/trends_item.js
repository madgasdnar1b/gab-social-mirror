import classNames from 'classnames/bind'
import Button from './button'
import DotTextSeperator from './dot_text_seperator'
import Image from './image'
import RelativeTimestamp from './relative_timestamp'
import Text from './text'

const cx = classNames.bind(_s)

export default class TrendingItem extends PureComponent {

  static propTypes = {
    index: PropTypes.number,
    url: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    description: PropTypes.string,
    imageUrl: PropTypes.string,
    author: PropTypes.string,
    publishDate: PropTypes.string,
    isLast: PropTypes.bool,
  }

  state = {
    hovering: false,
  }

  handleOnMouseEnter = () => {
    this.setState({ hovering: true })
  }

  handleOnMouseLeave = () => {
    this.setState({ hovering: false })
  }

  render() {
    const {
      index,
      url,
      title,
      description,
      imageUrl,
      author,
      publishDate,
      isLast
    } = this.props
    const { hovering } = this.state

    const containerClasses = cx({
      default: 1,
      noUnderline: 1,
      px15: 1,
      pt10: 1,
      pb5: 1,
      borderColorSecondary: !isLast,
      borderBottom1PX: !isLast,
      backgroundSubtle_onHover: 1,
    })

    const subtitleClasses = cx({
      ml5: 1,
      underline: hovering,
    })

    const correctedAuthor = author.replace('www.', '')
    const correctedDescription = description.length > 120 ? `${description.substring(0, 120)}...` : description
  
    return (
      <Button
        noClasses
        href={url}
        className={containerClasses}
        onMouseEnter={() => this.handleOnMouseEnter()}
        onMouseLeave={() => this.handleOnMouseLeave()}
      >
        <Image
          nullable
          width='116px'
          height='78px'
          src={imageUrl}
          className={[_s.radiusSmall, _s.overflowHidden, _s.mb10].join(' ')}
        />
        <div className={[_s.default, _s.flexNormal, _s.pb5].join(' ')}>
          <div className={_s.default}>
            <Text size='medium' color='primary' weight='bold'>
              {title}
            </Text>
          </div>

          <div className={[_s.default, _s.heightMax56PX, _s.overflowHidden, _s.py5].join(' ')}>
            <Text size='small' color='secondary'>
              {correctedDescription}
            </Text>
          </div>
          <div className={[_s.default, _s.flexRow].join(' ')}>
            <Text color='secondary' size='small'>
              {index}
            </Text>
            <DotTextSeperator />
            <Text color='secondary' size='small' className={_s.ml5}>
              {correctedAuthor}
            </Text>
            <DotTextSeperator />
            <Text color='secondary' size='small' className={subtitleClasses}>
              <RelativeTimestamp timestamp={publishDate} />
            </Text>
            <DotTextSeperator />
            <Text color='secondary' size='small' className={_s.ml5}>→</Text>
          </div>
        </div>
      </Button>
    )
  }

}
