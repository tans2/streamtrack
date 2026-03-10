import express from 'express';
import crypto from 'crypto';
import { DatabaseService, supabase } from '../services/database';
import { authenticateToken } from './auth';

const router = express.Router();

// ===== WATCH GROUPS ENDPOINTS =====

// Create a new watch group
router.post('/', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const { showId, name } = req.body;

    if (!showId || !name) {
      return res.status(400).json({ success: false, error: 'showId and name are required' });
    }

    const inviteCode = crypto.randomBytes(16).toString('hex');

    const group = await DatabaseService.createWatchGroup({
      showId,
      name,
      createdBy: userId,
      inviteCode,
    });

    if (!group) {
      return res.status(500).json({ success: false, error: 'Failed to create group' });
    }

    res.status(201).json({ success: true, data: group });
  } catch (error: any) {
    console.error('Error creating group:', error);
    res.status(500).json({ success: false, error: 'Failed to create group' });
  }
});

// List user's groups
router.get('/', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const groups = await DatabaseService.getUserGroups(userId);
    res.json({ success: true, data: groups });
  } catch (error: any) {
    console.error('Error fetching groups:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch groups' });
  }
});

// Preview group via invite code (must be before /:groupId to avoid conflict)
router.get('/invite/:inviteCode', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const { inviteCode } = req.params;

    const group = await DatabaseService.getGroupByInviteCode(inviteCode);
    if (!group) {
      return res.status(404).json({ success: false, error: 'Invalid invite code' });
    }

    const isMember = await DatabaseService.isGroupMember(group.id, userId);
    const memberCount = await DatabaseService.getGroupMemberCount(group.id);

    res.json({
      success: true,
      data: {
        group_id: group.id,
        group_name: group.name,
        show: group.shows,
        member_count: memberCount,
        is_member: isMember,
      },
    });
  } catch (error: any) {
    console.error('Error previewing invite:', error);
    res.status(500).json({ success: false, error: 'Failed to preview invite' });
  }
});

// Join a group via invite code
router.post('/join', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const { inviteCode } = req.body;

    if (!inviteCode) {
      return res.status(400).json({ success: false, error: 'inviteCode is required' });
    }

    const group = await DatabaseService.getGroupByInviteCode(inviteCode);
    if (!group) {
      return res.status(404).json({ success: false, error: 'Invalid invite code' });
    }

    const alreadyMember = await DatabaseService.isGroupMember(group.id, userId);
    if (alreadyMember) {
      return res.status(400).json({ success: false, error: 'Already a member of this group' });
    }

    const member = await DatabaseService.addGroupMember(group.id, userId);
    if (!member) {
      return res.status(500).json({ success: false, error: 'Failed to join group' });
    }

    // Auto-follow the show if not already following
    let autoFollowed = false;
    const followResult = await DatabaseService.followShow(userId, group.show_id);
    if (followResult) {
      autoFollowed = true;
    }

    res.json({
      success: true,
      data: {
        group: { id: group.id, name: group.name, show_id: group.show_id },
        autoFollowed,
      },
    });
  } catch (error: any) {
    console.error('Error joining group:', error);
    res.status(500).json({ success: false, error: 'Failed to join group' });
  }
});

// Get group details with member progress
router.get('/:groupId', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const { groupId } = req.params;

    // Verify membership
    const isMember = await DatabaseService.isGroupMember(groupId, userId);
    if (!isMember) {
      return res.status(403).json({ success: false, error: 'Not a member of this group' });
    }

    const group = await DatabaseService.getGroupDetails(groupId);
    if (!group) {
      return res.status(404).json({ success: false, error: 'Group not found' });
    }

    res.json({ success: true, data: group });
  } catch (error: any) {
    console.error('Error fetching group details:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch group details' });
  }
});

// Delete a group (admin only)
router.delete('/:groupId', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const { groupId } = req.params;

    const role = await DatabaseService.getGroupMemberRole(groupId, userId);
    if (role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Only the group admin can delete this group' });
    }

    const deleted = await DatabaseService.deleteWatchGroup(groupId);
    if (!deleted) {
      return res.status(500).json({ success: false, error: 'Failed to delete group' });
    }

    res.json({ success: true, message: 'Group deleted' });
  } catch (error: any) {
    console.error('Error deleting group:', error);
    res.status(500).json({ success: false, error: 'Failed to delete group' });
  }
});

// Leave a group
router.delete('/:groupId/leave', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const { groupId } = req.params;

    const role = await DatabaseService.getGroupMemberRole(groupId, userId);
    if (!role) {
      return res.status(404).json({ success: false, error: 'Not a member of this group' });
    }

    if (role === 'admin') {
      return res.status(400).json({ success: false, error: 'Admin cannot leave the group. Delete the group instead.' });
    }

    const removed = await DatabaseService.removeGroupMember(groupId, userId);
    if (!removed) {
      return res.status(500).json({ success: false, error: 'Failed to leave group' });
    }

    res.json({ success: true, message: 'Left group' });
  } catch (error: any) {
    console.error('Error leaving group:', error);
    res.status(500).json({ success: false, error: 'Failed to leave group' });
  }
});

// Remove a member from a group (admin only)
router.delete('/:groupId/members/:userId', authenticateToken, async (req: any, res) => {
  try {
    const adminId = req.user.id;
    const { groupId, userId } = req.params;

    if (adminId === userId) {
      return res.status(400).json({ success: false, error: 'Cannot remove yourself. Use leave instead.' });
    }

    const role = await DatabaseService.getGroupMemberRole(groupId, adminId);
    if (role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Only the group admin can remove members' });
    }

    const removed = await DatabaseService.removeGroupMember(groupId, userId);
    if (!removed) {
      return res.status(500).json({ success: false, error: 'Failed to remove member' });
    }

    res.json({ success: true, message: 'Member removed' });
  } catch (error: any) {
    console.error('Error removing member:', error);
    res.status(500).json({ success: false, error: 'Failed to remove member' });
  }
});

// Add a member by email (admin only)
router.post('/:groupId/add-member', authenticateToken, async (req: any, res) => {
  try {
    const adminId = req.user.id;
    const { groupId } = req.params;
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, error: 'Email is required' });
    }

    // Verify admin
    const role = await DatabaseService.getGroupMemberRole(groupId, adminId);
    if (role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Only the group admin can add members' });
    }

    // Look up user by email
    const targetUser = await DatabaseService.getUserByEmail(email);
    if (!targetUser) {
      return res.status(404).json({ success: false, error: 'No Scout user found with that email' });
    }

    // Check if already a member
    const alreadyMember = await DatabaseService.isGroupMember(groupId, targetUser.id);
    if (alreadyMember) {
      return res.status(400).json({ success: false, error: 'User is already a member of this group' });
    }

    // Add member
    const member = await DatabaseService.addGroupMember(groupId, targetUser.id);
    if (!member) {
      return res.status(500).json({ success: false, error: 'Failed to add member' });
    }

    // Auto-follow the show
    const { data: groupInfo } = await supabase
      .from('watch_groups')
      .select('show_id')
      .eq('id', groupId)
      .single();

    if (groupInfo?.show_id) {
      await DatabaseService.followShow(targetUser.id, groupInfo.show_id);
    }

    res.json({
      success: true,
      data: { user_id: targetUser.id, name: targetUser.name, email: targetUser.email },
    });
  } catch (error: any) {
    console.error('Error adding member:', error);
    res.status(500).json({ success: false, error: 'Failed to add member' });
  }
});

export default router;
