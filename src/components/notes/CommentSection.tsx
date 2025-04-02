import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { useAuth } from '../../contexts/AuthContext';
import { notesService } from '../../services/notes';
import { Comment } from '../../types/notes';
import { HeartIcon, ChatBubbleLeftIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';
import UserAvatar from '../shared/UserAvatar';

interface CommentSectionProps {
  noteId: string;
  noteUserId: string;
  likes?: number;
  likedBy?: string[];
  comments?: Comment[];
  isSharedNote: boolean;
}

export const CommentSection: React.FC<CommentSectionProps> = ({
  noteId,
  noteUserId,
  likes = 0,
  likedBy = [],
  comments = [],
  isSharedNote
}) => {
  const { user } = useAuth();
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(likes);
  const [commentText, setCommentText] = useState('');
  const [noteComments, setNoteComments] = useState<Comment[]>(comments);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Only show for shared notes and when the current user is not the note owner
  const shouldShowInteractions = isSharedNote && user && user.uid !== noteUserId;

  // Debug info
  useEffect(() => {
    console.log('CommentSection Debug Info:', { 
      isSharedNote, 
      noteId, 
      noteUserId, 
      currentUserId: user?.uid,
      shouldShowInteractions,
      likes: likeCount,
      likedBy,
      commentCount: noteComments.length
    });
  }, [isSharedNote, noteId, noteUserId, user, shouldShowInteractions, likeCount, likedBy, noteComments.length]);

  useEffect(() => {
    if (user && likedBy.includes(user.uid)) {
      setIsLiked(true);
    }
  }, [user, likedBy]);

  const handleLikeToggle = async () => {
    if (!user) return;
    
    try {
      setError(null);
      if (isLiked) {
        await notesService.unlikeNote(noteId, user.uid);
        setIsLiked(false);
        setLikeCount((prev) => Math.max(0, prev - 1));
      } else {
        await notesService.likeNote(noteId, user.uid);
        setIsLiked(true);
        setLikeCount((prev) => prev + 1);
      }
    } catch (err) {
      console.error('Error toggling like:', err);
      setError('Failed to update like. Please try again.');
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !commentText.trim()) return;

    try {
      setIsSubmitting(true);
      setError(null);
      const newComment = await notesService.addComment(noteId, user.uid, commentText);
      setNoteComments((prev) => [...prev, newComment]);
      setCommentText('');
    } catch (err) {
      console.error('Error adding comment:', err);
      setError('Failed to add comment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // If this is not a shared note or the user is the note owner, don't show the comment section
  if (!shouldShowInteractions && noteComments.length === 0) {
    return null;
  }

  const formatCommentDate = (timestamp: any) => {
    try {
      if (!timestamp || !timestamp.toDate) return '';
      return format(timestamp.toDate(), 'MMM d, yyyy h:mm a');
    } catch (error) {
      console.error('Error formatting date:', error);
      return '';
    }
  };

  return (
    <section className="mt-8 border-t border-gray-200 pt-6">
      {/* Like section */}
      <div className="flex items-center gap-4 mb-6">
        {shouldShowInteractions ? (
          <button
            onClick={handleLikeToggle}
            className="flex items-center gap-2 text-gray-500 hover:text-taste-primary transition-colors"
          >
            {isLiked ? (
              <HeartIconSolid className="h-5 w-5 text-taste-primary" />
            ) : (
              <HeartIcon className="h-5 w-5" />
            )}
            <span>{likeCount} {likeCount === 1 ? 'Like' : 'Likes'}</span>
          </button>
        ) : (
          <div className="flex items-center gap-2 text-gray-500">
            <HeartIcon className="h-5 w-5" />
            <span>{likeCount} {likeCount === 1 ? 'Like' : 'Likes'}</span>
          </div>
        )}
        <div className="flex items-center gap-2 text-gray-500">
          <ChatBubbleLeftIcon className="h-5 w-5" />
          <span>{noteComments.length} {noteComments.length === 1 ? 'Comment' : 'Comments'}</span>
        </div>
      </div>

      {/* Comment form - only for shared notes */}
      {shouldShowInteractions && (
        <form onSubmit={handleSubmitComment} className="mb-6">
          <div className="flex gap-4">
            <UserAvatar user={user} size="sm" />
            <div className="flex-1">
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Add a comment..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-taste-primary focus:border-transparent resize-none"
                rows={2}
                maxLength={500}
              />
              {error && <p className="mt-1 text-red-500 text-sm">{error}</p>}
              <div className="mt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmitting || !commentText.trim()}
                  className="px-4 py-2 bg-taste-primary text-white rounded-lg hover:bg-taste-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Posting...' : 'Post Comment'}
                </button>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* Comments list */}
      {noteComments.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-medium text-lg text-gray-900">Comments</h3>
          {noteComments.map((comment) => (
            <div key={comment.id} className="flex gap-4">
              <UserAvatar username={comment.username} profilePicture={comment.profilePicture} size="sm" />
              <div className="flex-1">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-medium text-gray-900">{comment.username}</span>
                    <span className="text-xs text-gray-500">{formatCommentDate(comment.createdAt)}</span>
                  </div>
                  <p className="text-gray-700 whitespace-pre-line">{comment.text}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default CommentSection; 