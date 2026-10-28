import { Link } from 'react-router-dom';
import { StatusBadge } from './Badges';
import Avatar from './Avatar';
import SmartImage from './SmartImage';
import { postImage } from '../utils/images';
import { timeAgo } from '../utils/format';

export default function PostCard({ post, basePath = '/community', onLike }) {
  return (
    <article className="card card-hover section-card" style={post.isHidden ? { opacity: 0.75 } : undefined}>
      <div className="d-flex flex-wrap gap-2 align-items-center mb-2">
        <span className="tone tone-lime">{post.category}</span>
        {post.isHidden && <StatusBadge status="Hidden" label="Hidden by moderator" />}
        <span className="small text-muted ms-auto">{timeAgo(post.createdAt)}</span>
      </div>
      <div className="d-flex gap-3 align-items-start">
        <div className="min-w-0 flex-grow-1">
          <h3 className="h5 mb-1"><Link to={`${basePath}/${post._id}`} className="text-decoration-none">{post.title}</Link></h3>
          <p className="text-muted line-clamp-2 mb-2">{post.body}</p>
        </div>
        <SmartImage image={postImage(post.category)} ratio="1 / 1" width={320} sizes="5.5rem" className="post-thumb" fallbackIcon="bi-flower2" fallbackLabel="Photo unavailable" />
      </div>
      <div className="d-flex flex-wrap align-items-center gap-3 small">
        <span className="d-inline-flex align-items-center gap-2"><Avatar name={post.author?.name} size="2rem" /><span><strong>{post.author?.name}</strong>{post.author?.location ? <span className="text-muted"> · {post.author.location}</span> : null}</span></span>
        <span className="ms-auto d-flex gap-2">
          {onLike ? (
            <button type="button" className={`btn btn-sm ${post.liked ? 'btn-primary' : 'btn-outline-primary'}`} aria-pressed={post.liked} onClick={() => onLike(post)}><i className={`bi ${post.liked ? 'bi-hand-thumbs-up-fill' : 'bi-hand-thumbs-up'} me-1`} aria-hidden="true" />{post.likesCount}</button>
          ) : <span className="text-muted"><i className="bi bi-hand-thumbs-up me-1" aria-hidden="true" />{post.likesCount}</span>}
          <Link to={`${basePath}/${post._id}`} className="btn btn-sm btn-outline-secondary"><i className="bi bi-chat-dots me-1" aria-hidden="true" />{post.commentCount}</Link>
        </span>
      </div>
    </article>
  );
}
