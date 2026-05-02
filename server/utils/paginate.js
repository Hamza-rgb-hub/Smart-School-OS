const paginate = async (Model, query = {}, options = {}) => {
  const {
    page = 1,
    limit = 10,
    sort = { createdAt: -1 },
    populate = null,
    select = null
  } = options;

  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
  const skip = (pageNum - 1) * limitNum;

  let queryBuilder = Model.find(query).sort(sort).skip(skip).limit(limitNum);

  if (populate) {
    if (Array.isArray(populate)) {
      populate.forEach(p => { queryBuilder = queryBuilder.populate(p); });
    } else {
      queryBuilder = queryBuilder.populate(populate);
    }
  }

  if (select) queryBuilder = queryBuilder.select(select);

  const [data, total] = await Promise.all([
    queryBuilder.exec(),
    Model.countDocuments(query)
  ]);

  return {
    data,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      pages: Math.ceil(total / limitNum),
      hasNext: pageNum < Math.ceil(total / limitNum),
      hasPrev: pageNum > 1
    }
  };
};

module.exports = { paginate };
