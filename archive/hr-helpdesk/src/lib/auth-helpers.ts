import { User, type IUser, OrganizationUser, type IOrganizationUser } from '@/lib/models';
import dbConnect from '@/lib/database';
import { encrypt, decrypt } from '@/lib/encryption';

export interface LyzrUserData {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
  api_key?: string;
  organization_id?: string;
  usage_id?: string;
  policy_id?: string;
  user_id?: string;
  role?: string;
  available_credits?: string;
}

/**
 * Create or update user based on Lyzr authentication data
 */
export async function createOrUpdateUser(lyzrUserData: LyzrUserData): Promise<IUser> {
  await dbConnect();

  try {
    // First, try to find user by Lyzr user ID
    let user = await User.findOne({ lyzrUserId: lyzrUserData.id });

    if (user) {
      // Update existing user if needed
      const updates: Partial<IUser> = {};
      
      if (lyzrUserData.name && user.name !== lyzrUserData.name) {
        updates.name = lyzrUserData.name;
      }
      
      if (lyzrUserData.email && user.email !== lyzrUserData.email) {
        updates.email = lyzrUserData.email;
      }
      
      if (lyzrUserData.avatar && user.avatar !== lyzrUserData.avatar) {
        updates.avatar = lyzrUserData.avatar;
      }

      // Update Lyzr-specific data
      if (lyzrUserData.api_key) {
        updates.lyzrApiKey = encrypt(lyzrUserData.api_key);
        // console.log('lyzrUserData.api_key', lyzrUserData.api_key);
        // console.log('updates.lyzrApiKey', updates.lyzrApiKey);
      }
      
      if (lyzrUserData.organization_id) {
        updates.lyzrOrganizationId = lyzrUserData.organization_id;
      }
      
      if (lyzrUserData.policy_id) {
        updates.lyzrPolicyId = lyzrUserData.policy_id;
      }
      
      if (lyzrUserData.usage_id) {
        updates.lyzrUsageId = lyzrUserData.usage_id;
      }
      
      if (lyzrUserData.role) {
        updates.lyzrRole = lyzrUserData.role;
      }
      
      if (lyzrUserData.available_credits) {
        updates.lyzrCredits = lyzrUserData.available_credits;
      }

      if (Object.keys(updates).length > 0) {
        user = await User.findByIdAndUpdate(user._id, updates, { new: true });
      }
      
      // console.log('updated user', user);
      return user!;
    }

    // If not found by Lyzr ID, check by email (for existing users who haven't linked Lyzr yet)
    user = await User.findOne({ email: lyzrUserData.email });

    if (user) {
      // Link existing user with Lyzr ID and update data
      const updates: any = {
        lyzrUserId: lyzrUserData.id,
        name: lyzrUserData.name || user.name,
        avatar: lyzrUserData.avatar || user.avatar,
      };

      // Add Lyzr-specific data
      if (lyzrUserData.api_key) {
        updates.lyzrApiKey = encrypt(lyzrUserData.api_key);
        // console.log('2 lyzrUserData.api_key', lyzrUserData.api_key);
        // console.log('2 updates.lyzrApiKey', updates.lyzrApiKey);
      }
      if (lyzrUserData.organization_id) {
        updates.lyzrOrganizationId = lyzrUserData.organization_id;
      }
      if (lyzrUserData.policy_id) {
        updates.lyzrPolicyId = lyzrUserData.policy_id;
      }
      if (lyzrUserData.usage_id) {
        updates.lyzrUsageId = lyzrUserData.usage_id;
      }
      if (lyzrUserData.role) {
        updates.lyzrRole = lyzrUserData.role;
      }
      if (lyzrUserData.available_credits) {
        updates.lyzrCredits = lyzrUserData.available_credits;
      }

      user = await User.findByIdAndUpdate(user._id, updates, { new: true });
      // console.log('2 updated user', user);
      return user!;
    }

    const nameFromEmail = lyzrUserData.email.split('@')[0].charAt(0).toUpperCase() + lyzrUserData.email.split('@')[0].slice(1);

    // Create new user
    const newUser = new User({
      name: lyzrUserData.name || nameFromEmail || 'User',
      email: lyzrUserData.email,
      lyzrUserId: lyzrUserData.id,
      avatar: lyzrUserData.avatar,
      lyzrApiKey: lyzrUserData.api_key ? encrypt(lyzrUserData.api_key) : null,
      lyzrOrganizationId: lyzrUserData.organization_id,
      lyzrPolicyId: lyzrUserData.policy_id,
      lyzrUsageId: lyzrUserData.usage_id,
      lyzrRole: lyzrUserData.role,
      lyzrCredits: lyzrUserData.available_credits,
    });

    // console.log('3 newUser', newUser);
    // console.log('3 newUser.lyzrApiKey', newUser.lyzrApiKey);

    await newUser.save();

    // Check for existing organization invitations and link them to this new user
    await linkPendingOrganizationInvitations(newUser);

    return newUser;
  } catch (error) {
    console.error('Error creating/updating user:', error);
    throw new Error('Failed to create or update user');
  }
}

/**
 * Get user by ID (supports both MongoDB ObjectId and Lyzr user ID)
 */
export async function getUserById(userId: string): Promise<IUser | null> {
  await dbConnect();
  
  try {
    // First try to find by MongoDB ObjectId (24 character hex string)
    if (userId.match(/^[0-9a-fA-F]{24}$/)) {
      const user = await User.findById(userId);
      if (user) return user;
    }
    
    // If not found or not a valid ObjectId, try finding by lyzrUserId
    const user = await User.findOne({ lyzrUserId: userId });
    return user;
  } catch (error) {
    console.error('Error fetching user:', error);
    return null;
  }
}

/**
 * Get user by email
 */
export async function getUserByEmail(email: string): Promise<IUser | null> {
  await dbConnect();
  
  try {
    const user = await User.findOne({ email: email.toLowerCase() });
    return user;
  } catch (error) {
    console.error('Error fetching user by email:', error);
    return null;
  }
}

/**
 * Get user's decrypted API key
 */
export async function getUserApiKey(userId: string): Promise<string | null> {
  await dbConnect();
  
  try {
    const user = await getUserById(userId);
    if (user && user.lyzrApiKey) {
      return decrypt(user.lyzrApiKey);
    }
    return null;
  } catch (error) {
    console.error('Error fetching user API key:', error);
    return null;
  }
}

/**
 * Update user's current organization
 */
export async function updateUserCurrentOrganization(userId: string, organizationId: string): Promise<IUser | null> {
  await dbConnect();
  
  try {
    const user = await User.findByIdAndUpdate(
      userId,
      { currentOrganization: organizationId },
      { new: true }
    );
    return user;
  } catch (error) {
    console.error('Error updating user current organization:', error);
    return null;
  }
}

/**
 * Link pending organization invitations to newly created user
 */
async function linkPendingOrganizationInvitations(newUser: IUser): Promise<void> {
  try {
    // Find all pending invitations for this email
    const pendingInvitations = await OrganizationUser.find({
      email: newUser.email.toLowerCase(),
      userId: null, // Not yet linked to a user
      status: 'invited'
    });

    if (pendingInvitations.length > 0) {
      // Update all pending invitations to link to this user and mark as active
      await OrganizationUser.updateMany(
        {
          email: newUser.email.toLowerCase(),
          userId: null,
          status: 'invited'
        },
        {
          userId: newUser._id,
          status: 'active',
          joinedAt: new Date()
        }
      );

      console.log(`Linked ${pendingInvitations.length} pending organization invitations to user ${newUser.email}`);
    }
  } catch (error) {
    console.error('Error linking pending organization invitations:', error);
    // Don't throw error as user creation was successful, this is just a bonus operation
  }
}

/**
 * Get user's role in a specific organization
 */
export async function getUserRoleInOrganization(userId: string, organizationId: string): Promise<string | null> {
  await dbConnect();
  
  try {
    // First, find the user by their Lyzr user ID to get their MongoDB _id
    const user = await User.findOne({ lyzrUserId: userId });
    if (!user) {
      console.log(`User not found with Lyzr ID: ${userId}`);
      return null;
    }

    // Then find their role in the organization using their MongoDB _id
    const organizationUser = await OrganizationUser.findOne({
      userId: user._id,
      organizationId: organizationId,
      status: 'active'
    });
    
    return organizationUser ? organizationUser.role : null;
  } catch (error) {
    console.error('Error fetching user role in organization:', error);
    return null;
  }
}