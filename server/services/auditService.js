import { query } from "../config/db.js";

export const audit = (userId, action, entityType, entityId, metadata = {}) =>
  query(
    "INSERT INTO audit_logs (user_id,action,entity_type,entity_id,metadata) VALUES (:userId,:action,:entityType,:entityId,:metadata)",
    { userId, action, entityType, entityId, metadata: JSON.stringify(metadata) },
  );
