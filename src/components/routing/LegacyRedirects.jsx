import { Navigate, useParams } from 'react-router-dom';
import { postMediaPath } from '@/lib/appRoutes';

/** /org/:id → /partners/:id */
export function RedirectOrgToPartner() {
  const { id } = useParams();
  return <Navigate to={`/partners/${id}`} replace />;
}

/** /user/:handle → /profile/:handle */
export function RedirectUserHandleToProfile() {
  const { handle } = useParams();
  return <Navigate to={`/profile/${handle}`} replace />;
}

/** /media/post/:postId/... → /posts/:postId/media/... */
export function RedirectLegacyPostMedia() {
  const { postId, mediaIndex } = useParams();
  const path = postMediaPath(postId, mediaIndex !== undefined && mediaIndex !== '' ? Number(mediaIndex) : undefined);
  return <Navigate to={path} replace />;
}
