import { getPublicCanonicalProfileById, isPublicProfileUserId } from "../../../../lib/canonical-public-profiles";
import { AppError } from "../../lib/app-error";

export class ProfileService {
  async getPublicProfile(userId: string) {
    if (!isPublicProfileUserId(userId)) {
      throw new AppError("User id must be a valid UUID.", {
        statusCode: 400,
        code: "invalid_user_id",
      });
    }

    const profile = await getPublicCanonicalProfileById(userId, {
      refreshTrustScore: true,
    });

    if (!profile) {
      throw new AppError("Public profile not found.", {
        statusCode: 404,
        code: "profile_not_found",
      });
    }

    return profile;
  }
}
