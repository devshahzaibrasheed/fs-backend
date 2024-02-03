const pagination = ({ page = 1, per_page = 10 }) => {
  const offset = Math.max(per_page * (page - 1), 0)
  const limit = per_page;
  return {
    offset,
    limit
  };
};

module.exports = { pagination };