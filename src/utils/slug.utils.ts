import mongoose, { Model } from "mongoose";
import slugify  from "slugify";

export const createUniqueSlug = async(
    title: string,
    model: Model<any>,
    excludeId?: mongoose.Types.ObjectId
): Promise<string> => {
    const baseSlug = slugify(title, { lower: true, strict: true });
    
    // Handle duplicate slugs by appending a number
    let slug = baseSlug;
    let count = 1;
    while (await model.findOne({ slug, _id: { $ne:excludeId} })) {
      slug = `${baseSlug}-${count}`;
      count++;
    }
    return slug;
}