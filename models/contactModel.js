const db = require('../config/db');

const getAllContacts = async () => {
    const result = await db.query('SELECT * FROM contacts ORDER BY id ASC');
    return result.rows;
};

const getContactById = async (id) => {
    const result = await db.query('SELECT * FROM contacts WHERE id = $1', [id]);
    return result.rows[0];
};

const createContact = async ({ name, discord, discord_id, whatsapp }) => {
    const result = await db.query(
        'INSERT INTO contacts (name, discord, discord_id, whatsapp) VALUES ($1, $2, $3, $4) RETURNING *',
        [name, discord, discord_id, whatsapp || null]
    );
    return result.rows[0];
};

const updateContact = async (id, { name, discord, discord_id, whatsapp }) => {
    const result = await db.query(
        'UPDATE contacts SET name = $1, discord = $2, discord_id = $3, whatsapp = $4, updated_at = CURRENT_TIMESTAMP WHERE id = $5 RETURNING *',
        [name, discord, discord_id, whatsapp || null, id]
    );
    return result.rows[0];
};

const updateImage = async (id, image_url) => {
    const result = await db.query(
        'UPDATE contacts SET image_url = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
        [image_url, id]
    );
    return result.rows[0];
};

const deleteContact = async (id) => {
    const result = await db.query('DELETE FROM contacts WHERE id = $1 RETURNING *', [id]);
    return result.rows[0];
};

module.exports = {
    getAllContacts,
    getContactById,
    createContact,
    updateContact,
    updateImage,
    deleteContact
};
