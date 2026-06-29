import { query } from "../config/db.js";

export const notify = (userId, type, title, message, link = null) =>
  query(
    "INSERT INTO notifications (user_id,type,title,message,link) VALUES (:userId,:type,:title,:message,:link)",
    { userId, type, title, message, link },
  );
