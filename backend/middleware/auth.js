
function requireAdmin(req, res, next) {
    if (!req.session || req.session.isAdmin !== true) {
        return res.redirect("/admin-login.html");
    }

    // Prevent browser from caching protected admin pages
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, private");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");

    next();
}

module.exports = requireAdmin;
