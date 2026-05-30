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

const cloudinary = require('cloudinary').v2;

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key:     process.env.CLOUDINARY_API_KEY,
    api_secret:  process.env.CLOUDINARY_API_SECRET
});

const getPublicIdFromUrl = (url) => {
    if (!url || !url.includes('cloudinary.com')) return null;
    const parts = url.split('/upload/');
    if (parts.length < 2) return null;
    const pathAndFilename = parts[1].replace(/^v\d+\//, ''); // hapus format versi (contoh: v12345/)
    const lastDotIndex = pathAndFilename.lastIndexOf('.');
    return lastDotIndex === -1 ? pathAndFilename : pathAndFilename.substring(0, lastDotIndex);
};

const deleteFromCloudinary = async (url) => {
    const publicId = getPublicIdFromUrl(url);
    if (publicId) {
        try {
            await cloudinary.uploader.destroy(publicId);
        } catch (err) {
            console.error('Gagal menghapus gambar lama dari Cloudinary:', err.message);
        }
    }
};

const uploadToCloudinary = (fileBuffer, folder) => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder: folder,
                resource_type: 'image',
                transformation: [
                    { width: 500, height: 500, crop: 'fill', gravity: 'face' },
                    { quality: 'auto' },
                    { fetch_format: 'webp' }
                ]
            },
            (error, result) => {
                if (error) reject(error);
                else resolve(result);
            }
        );
        uploadStream.end(fileBuffer);
    });
};

const uploadImage = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Tidak ada file diupload' });
        }
        
        const existingContact = await ContactModel.getContactById(req.params.id);
        if (existingContact && existingContact.image_url) {
            await deleteFromCloudinary(existingContact.image_url);
        }

        const folder = 'digishop/contacts';
        const cloudinaryResult = await uploadToCloudinary(req.file.buffer, folder);
        const imageUrl = cloudinaryResult.secure_url;

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
            await deleteFromCloudinary(contact.image_url);
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
