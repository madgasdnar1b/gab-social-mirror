const SortIcon = ({
  className = '',
  size = '32px',
  title = 'Sort',
}) => (
  <svg
    className={className}
    version='1.1'
    xmlns='http://www.w3.org/2000/svg'
    x='0px'
    y='0px'
    width={size}
    height={size}
    viewBox='0 0 32 32'
    xmlSpace='preserve'
    aria-label={title}
  >

    <g>
      <path d='M 31.007812 8.644531 L 23.480469 1.117188 C 22.988281 0.625 22.195312 0.625 21.699219 1.117188 L 14.179688 8.644531 C 13.6875 9.136719 13.6875 9.929688 14.179688 10.425781 C 14.675781 10.917969 15.46875 10.917969 15.960938 10.425781 L 21.320312 5.070312 L 21.320312 27.117188 C 21.320312 27.824219 21.886719 28.394531 22.59375 28.394531 C 23.300781 28.394531 23.867188 27.824219 23.867188 27.117188 L 23.867188 5.070312 L 29.226562 10.425781 C 29.71875 10.917969 30.511719 10.917969 31.007812 10.425781 C 31.5 9.9375 31.5 9.136719 31.007812 8.644531 Z M 31.007812 8.644531' />
      <path d='M 17.945312 21.699219 C 17.449219 21.207031 16.65625 21.207031 16.164062 21.699219 L 10.804688 27.054688 L 10.804688 5.007812 C 10.804688 4.300781 10.238281 3.730469 9.53125 3.730469 C 8.824219 3.730469 8.257812 4.300781 8.257812 5.007812 L 8.257812 27.054688 L 2.898438 21.699219 C 2.40625 21.207031 1.613281 21.207031 1.117188 21.699219 C 0.625 22.195312 0.625 22.988281 1.117188 23.480469 L 8.644531 31.007812 C 9.136719 31.5 9.929688 31.5 10.425781 31.007812 L 17.949219 23.480469 C 18.4375 22.988281 18.4375 22.1875 17.945312 21.699219 Z M 17.945312 21.699219' />
    </g>

  </svg>
)

export default SortIcon