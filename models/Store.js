const mongoose = require("mongoose");
mongoose.Promise = global.Promise;
const slug = require("slugs");

const storeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      required: "Please enter a store name!",
    },
    slug: String,
    description: {
      type: String,
      trim: true,
    },
    tags: [String],
    created: {
      type: Date,
      default: Date.now,
    },
    location: {
      type: {
        type: String,
        default: "Point",
      },
      coordinates: [
        {
          type: Number,
          required: "You must supply coordinates!",
        },
      ],
      address: {
        type: String,
        required: "You must supply an address!",
      },
    },
    photo: String,
    author: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: "You must supply an author",
    },
  },
  {
    toJSON: { virtuals: true }, // populate virtuals when convert to JSON or Object - default === false
    toObject: { virtuals: true },
  }
);

storeSchema.index({
  name: "text",
  description: "text",
});

storeSchema.index({ location: "2dsphere" });

storeSchema.pre("save", async function (next) {
  if (!this.isModified("name")) {
    next(); // skips if the name is not modified
    return;
  }
  this.slug = slug(this.name);
  const slugRegEx = new RegExp(`^({this.slug})((-[0-9]*$)?)$`, "i");
  const storeWithSlug = await this.constructor.find({ slug: slugRegEx });
  if (storeWithSlug.length) {
    this.slug = `${this.slug}-${storeWithSlug.length + 1}`;
  }
  next();
});

storeSchema.statics.getTagsList = function () {
  return this.aggregate([
    { $unwind: "$tags" },
    { $group: { _id: "$tags", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);
};

storeSchema.statics.getTopStores = function () {
  return this.aggregate([
    // lookup stores and populate their reviews
    {
      $lookup: {
        from: "reviews",
        localField: "_id",
        foreignField: "store",
        as: "reviews",
      },
    },
    // filter for only stores with at least 2 reviews
    { $match: { "reviews.1": { $exists: true } } },
    // add average field
    {
      $project: {
        averageRating: { $avg: "$reviews.rating" },
        // project removes all other fields - we need to add them back in
        photo: "$$ROOT.photo",
        name: "$$ROOT.name",
        reviews: "$$ROOT.reviews",
        slug: "$$ROOT.slug",
      },
    },
    // sort by new field "averageRating"
    { $sort: { averageRating: -1 } },
    // limit to 10
    { $limit: 10 },
  ]);
};

function autoPopulate(next) {
  this.populate("reviews");
  next();
}

storeSchema.pre("find", autoPopulate);
storeSchema.pre("findOne", autoPopulate);

// find reviews where the store _id === reviews store property:
storeSchema.virtual("reviews", {
  ref: "Review", // what model to link
  localField: "_id", // which field on the store
  foreignField: "store", // which field onn the review
});

module.exports = mongoose.model("Store", storeSchema);
