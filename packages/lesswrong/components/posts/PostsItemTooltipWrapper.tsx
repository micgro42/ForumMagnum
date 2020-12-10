import React from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { useHover } from "../common/withHover";

const PostsItemTooltipWrapper = ({children, post, className}: {
  children?: React.ReactNode,
  post: PostsList,
  className?: string,
}) => {
  const { LWPopper, PostsPreviewTooltip } = Components
  const {eventHandlers, hover, stopHover, anchorEl} = useHover({
    pageElementContext: "postItemTooltip",
    postId: post?._id
  });
  return <div {...eventHandlers} className={className}>
      <LWPopper
        open={hover}
        anchorEl={anchorEl}
        onMouseEnter={stopHover}
        placement="bottom-end"
        modifiers={{
          flip: {
            enabled: false
          }
        }}
      >
        <PostsPreviewTooltip post={post} postsList />
      </LWPopper>
      { children }
  </div>
}

const PostsItemTooltipWrapperComponent = registerComponent('PostsItemTooltipWrapper', PostsItemTooltipWrapper
)

declare global {
  interface ComponentTypes {
    PostsItemTooltipWrapper: typeof PostsItemTooltipWrapperComponent
  }
}

