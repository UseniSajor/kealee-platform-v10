'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Send, Trash2, Edit2, Check, X } from 'lucide-react';

/**
 * Review Comments Component
 * Displays and manages comments for permit reviews
 */

interface Comment {
  id: string;
  author: string;
  authorRole: string;
  text: string;
  createdAt: string;
  severity?: 'critical' | 'major' | 'minor' | 'info';
  status?: 'open' | 'resolved' | 'acknowledged';
}

interface ReviewCommentsProps {
  reviewId: string;
  comments?: Comment[];
  onAddComment?: (text: string) => Promise<void>;
  onEditComment?: (commentId: string, text: string) => Promise<void>;
  onDeleteComment?: (commentId: string) => Promise<void>;
  onResolveComment?: (commentId: string) => Promise<void>;
  currentUserRole?: string;
}

export function ReviewComments({
  reviewId,
  comments = [],
  onAddComment,
  onEditComment,
  onDeleteComment,
  onResolveComment,
  currentUserRole = 'reviewer',
}: ReviewCommentsProps) {
  const [newComment, setNewComment] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddComment = async () => {
    if (!newComment.trim() || !onAddComment) return;

    setIsSubmitting(true);
    try {
      await onAddComment(newComment);
      setNewComment('');
    } catch (error) {
      console.error('Failed to add comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditComment = async (commentId: string) => {
    if (!editText.trim() || !onEditComment) return;

    setIsSubmitting(true);
    try {
      await onEditComment(commentId, editText);
      setEditingId(null);
      setEditText('');
    } catch (error) {
      console.error('Failed to edit comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const startEditing = (comment: Comment) => {
    setEditingId(comment.id);
    setEditText(comment.text);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditText('');
  };

  const getSeverityColor = (severity?: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'major':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'minor':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'info':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'resolved':
        return 'bg-green-100 text-green-800';
      case 'acknowledged':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Comments ({comments.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Comment List */}
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {comments.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No comments yet. Add the first comment below.
            </p>
          ) : (
            comments.map((comment) => (
              <div
                key={comment.id}
                className={`border rounded-lg p-3 ${
                  comment.severity ? getSeverityColor(comment.severity) : 'border-gray-200'
                }`}
              >
                {/* Comment Header */}
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{comment.author}</span>
                    <Badge variant="outline" className="text-xs">
                      {comment.authorRole}
                    </Badge>
                    {comment.severity && (
                      <Badge variant="outline" className="text-xs">
                        {comment.severity}
                      </Badge>
                    )}
                    {comment.status && (
                      <Badge className={`text-xs ${getStatusColor(comment.status)}`}>
                        {comment.status}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    {currentUserRole === 'reviewer' && comment.status === 'open' && onResolveComment && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onResolveComment(comment.id)}
                        className="h-7 w-7 p-0"
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                    )}
                    {onEditComment && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => startEditing(comment)}
                        className="h-7 w-7 p-0"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    )}
                    {onDeleteComment && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDeleteComment(comment.id)}
                        className="h-7 w-7 p-0 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>

                {/* Comment Body */}
                {editingId === comment.id ? (
                  <div className="space-y-2">
                    <Textarea
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      className="min-h-[80px]"
                      disabled={isSubmitting}
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleEditComment(comment.id)}
                        disabled={isSubmitting || !editText.trim()}
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={cancelEditing}
                        disabled={isSubmitting}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm whitespace-pre-wrap">{comment.text}</p>
                )}

                {/* Comment Footer */}
                <div className="mt-2 text-xs text-muted-foreground">
                  {new Date(comment.createdAt).toLocaleString()}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Add New Comment */}
        {onAddComment && (
          <div className="space-y-2 border-t pt-4">
            <Textarea
              placeholder="Add a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="min-h-[100px]"
              disabled={isSubmitting}
            />
            <Button
              onClick={handleAddComment}
              disabled={isSubmitting || !newComment.trim()}
              className="w-full"
            >
              <Send className="h-4 w-4 mr-2" />
              {isSubmitting ? 'Sending...' : 'Add Comment'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
