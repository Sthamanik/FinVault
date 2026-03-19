import Blog from '@models/blog.model.js';
import Service from '@models/service.model.js';
import Team from '@models/team.model.js';
import Reward from '@models/reward.model.js';
import Contact from '@models/contact.model.js';
import Career from '@models/career.model.js';
import Application from '@models/application.model.js';

class DashboardService {
  async getSummary() {
    const [
      // Module counts 
      blogCount,
      serviceCount,
      teamCount,
      rewardCount,
      contactCount,
      careerCount,
      applicationCount,

      // Recent items
      recentContacts,
      recentApplications,

      // Status breakdowns
      contactStatusBreakdown,
      applicationStatusBreakdown,
    ] = await Promise.all([
      // Counts (exclude soft-deleted)
      Blog.countDocuments({ isDeleted: false }),
      Service.countDocuments({ isDeleted: false }),
      Team.countDocuments({ isDeleted: false }),
      Reward.countDocuments({ isDeleted: false }),
      Contact.countDocuments({ isDeleted: false }),
      Career.countDocuments({ isDeleted: false }),
      Application.countDocuments({ isDeleted: false }),

      // Recent contacts (last 5)
      Contact.find({ isDeleted: false })
        .sort({ createdAt: -1 })
        .limit(5)
        .select('name email subject status createdAt')
        .lean(),

      // Recent applications (last 5, populated with job title)
      Application.find({ isDeleted: false })
        .sort({ createdAt: -1 })
        .limit(5)
        .select('name email status createdAt jobId')
        .populate({ path: 'jobId', select: 'title' })
        .lean(),

      // Contact status breakdown
      Contact.aggregate([
        { $match: { isDeleted: false } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),

      // Application status breakdown
      Application.aggregate([
        { $match: { isDeleted: false } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
    ]);

    // Normalize breakdown arrays into plain objects { status: count }
    const normalizeBreakdown = (arr: { _id: string; count: number }[]) =>
      arr.reduce<Record<string, number>>((acc, { _id, count }) => {
        acc[_id] = count;
        return acc;
      }, {});

    return {
      counts: {
        blogs: blogCount,
        services: serviceCount,
        team: teamCount,
        rewards: rewardCount,
        contacts: contactCount,
        careers: careerCount,
        applications: applicationCount,
      },
      recent: {
        contacts: recentContacts,
        applications: recentApplications,
      },
      breakdowns: {
        contacts: normalizeBreakdown(contactStatusBreakdown),
        applications: normalizeBreakdown(applicationStatusBreakdown),
      },
    };
  }
}

export default new DashboardService();