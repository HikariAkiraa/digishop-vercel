const ContactModel = require('../models/contactModel');
const fs = require('fs');
const path = require('path');

const getContacts = async (req, res) => {
    try {
        const contacts = await ContactModel.getAllContacts();
        res.json({ success: true, data: contacts });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Database error', error: err.message });
    }
};

const createContact = async (req, res) => {
    try {
        const { name, discord, discord_id, whatsapp } = req.body;
        if (!name || !discord || !discord_id) {
            return res.status(400).json({ success: false, message: 'Nama, Discord, dan Discord ID wajib diisi' });
        }
        const contact = await ContactModel.createContact({ name, discord, discord_id, whatsapp });
        res.status(201).json({ success: true, message: 'Kontak berhasil ditambahkan', data: contact });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Database error', error: err.message });
    }
};

const updateContact = async (req, res) => {
    try {
        const { name, discord, discord_id, whatsapp } = req.body;
        if (!name || !discord || !discord_id) {
            return res.status(400).json({ success: false, message: 'Nama, Discord, dan Discord ID wajib diisi' });
        }
        const contact = await ContactModel.updateContact(req.params.id, { name, discord, discord_id, whatsapp });
        if (!contact) {
            return res.status(404).json({ success: false, message: 'Kontak tidak ditemukan' });
        }
        res.json({ success: true, message: 'Kontak berhasil diupdate', data: contact });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Database error', error: err.message });
    }
};

const uploadImage = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Tidak ada file diupload' });
        }
        
        const existingContact = await ContactModel.getContactById(req.params.id);
        if (existingContact && existingContact.image_url) {
            const oldImagePath = path.join(__dirname, '..', existingContact.image_url);
            if (fs.existsSync(oldImagePath)) {
                fs.unlinkSync(oldImagePath);
            }
        }

        const imageUrl = `/uploads/${req.file.filename}`;
        const contact = await ContactModel.updateImage(req.params.id, imageUrl);
        if (!contact) {
            return res.status(404).json({ success: false, message: 'Kontak tidak ditemukan' });
        }
        res.json({ success: true, message: 'Gambar berhasil diupload', data: contact });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Database error', error: err.message });
    }
};

const deleteContact = async (req, res) => {
    try {
        const contact = await ContactModel.deleteContact(req.params.id);
        if (!contact) {
            return res.status(404).json({ success: false, message: 'Kontak tidak ditemukan' });
        }
        if (contact.image_url) {
            const oldImagePath = path.join(__dirname, '..', contact.image_url);
            if (fs.existsSync(oldImagePath)) {
                fs.unlinkSync(oldImagePath);
            }
        }
        res.json({ success: true, message: 'Kontak berhasil dihapus' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Database error', error: err.message });
    }
};

module.exports = {
    getContacts,
    createContact,
    updateContact,
    uploadImage,
    deleteContact
};
