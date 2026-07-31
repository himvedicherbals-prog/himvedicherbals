/**
 * PUT/DELETE /api/blog/comment/[id]
 * 
 * PUT:    Update comment status (moderation) or text
 * DELETE: Remove a comment
 * Uses BLOG_DB (D1) for comment management.
 */

export async function onRequestPut(context) {
  const { request, env, params } = context;
  
  try {
    const commentId = params.id;
    const data = await request.json();
    const { status, text } = data;
    
    // Check if comment exists
    const existingComment = await env.BLOG_DB.prepare(`
      SELECT id, status FROM comments WHERE id = ?
    `).bind(commentId).first();
    
    if (!existingComment) {
      return new Response(JSON.stringify({
        error: 'Comment not found'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Update fields
    if (status && ['pending', 'approved', 'rejected'].includes(status)) {
      await env.BLOG_DB.prepare(`
        UPDATE comments SET status = ? WHERE id = ?
      `).bind(status, commentId).run();
    }
    
    if (text !== undefined) {
      await env.BLOG_DB.prepare(`
        UPDATE comments SET text = ? WHERE id = ?
      `).bind(text, commentId).run();
    }
    
    console.log(`Comment ${commentId} updated`);
    
    return new Response(JSON.stringify({
      success: true,
      message: 'Comment updated successfully'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Update comment error:', error);
    
    return new Response(JSON.stringify({
      error: 'Failed to update comment.'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function onRequestDelete(context) {
  const { env, params } = context;
  
  try {
    const commentId = params.id;
    
    // Check if comment exists
    const existingComment = await env.BLOG_DB.prepare(`
      SELECT id FROM comments WHERE id = ?
    `).bind(commentId).first();
    
    if (!existingComment) {
      return new Response(JSON.stringify({
        error: 'Comment not found'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Delete child comments first (if any)
    await env.BLOG_DB.prepare(`
      DELETE FROM comments WHERE parent_id = ?
    `).bind(commentId).run();
    
    // Delete the comment
    await env.BLOG_DB.prepare(`
      DELETE FROM comments WHERE id = ?
    `).bind(commentId).run();
    
    // Delete associated reactions
    await env.BLOG_DB.prepare(`
      DELETE FROM comment_reactions WHERE comment_id = ?
    `).bind(commentId).run();
    
    console.log(`Comment ${commentId} deleted`);
    
    return new Response(JSON.stringify({
      success: true,
      message: 'Comment deleted successfully'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Delete comment error:', error);
    
    return new Response(JSON.stringify({
      error: 'Failed to delete comment.'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
