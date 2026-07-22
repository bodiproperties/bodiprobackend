import jwt from "jsonwebtoken";

export function login(req, res) {
  const { email, password } = req.body || {};

  const okEmail = email === process.env.ADMIN_EMAIL;
  const okPass = password === process.env.ADMIN_PASSWORD;

  if (!okEmail || !okPass) {
    return res.status(401).json({ error: "Нууц үг эсвэл майл буруу байна" });
  }

  const token = jwt.sign(
    { sub: email, role: "admin" },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  res.json({ token, admin: { email } });
}

export function me(req, res) {
  res.json({ admin: { email: req.admin.sub } });
}
