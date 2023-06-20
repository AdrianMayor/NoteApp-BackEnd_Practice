import { RequestHandler } from "express";
import createHttpError from "http-errors";
import mongoose from "mongoose";
import NoteModel from "../models/note";
import { assertIsDefined } from "../util/assertIsDefined";

export const getNotes: RequestHandler = async (req, res, next) => {
	const authenticatedUserId = req.session.userId;

	try {
		assertIsDefined(authenticatedUserId);

		const notes = await NoteModel.find({ userId: authenticatedUserId }).exec();
		res.status(200).json(notes);
	} catch (error) {
		next(error);
	}
};

export const getNote: RequestHandler = async (req, res, next) => {
	const { noteId } = req.params;
	const authenticatedUserId = req.session.userId;

	try {
		assertIsDefined(authenticatedUserId);

		if (!mongoose.isValidObjectId(noteId)) throw createHttpError(400, "Not valid id note");

		const note = await NoteModel.findById(noteId).exec();

		if (!note) throw createHttpError(404, "Note not found");

		if (!note.userId.equals(authenticatedUserId)) throw createHttpError(401, "You cannot access this note");

		res.status(200).json(note);
	} catch (error) {
		next(error);
	}
};

interface CreateNoteBody {
	title?: string;
	text?: string;
}

export const createNote: RequestHandler<unknown, unknown, CreateNoteBody, unknown> = async (req, res, next) => {
	const { title, text } = req.body;
	const authenticatedUserId = req.session.userId;

	try {
		assertIsDefined(authenticatedUserId);

		if (!title) throw createHttpError(400, "Title required");

		const newNote = await NoteModel.create({
			userId: authenticatedUserId,
			title: title,
			text: text,
		}); // Contrary to the "find" method, in this case it is not necessary to specify that the "exec( )" promise should be executed, it already returns a promise by itself.

		res.status(201).json(newNote);
	} catch (error) {
		next(error);
	}
};

interface UpdateNoteParams {
	noteId: string;
}

interface UpdateNoteBody {
	title?: string;
	text?: string;
}

export const updateNote: RequestHandler<UpdateNoteParams, unknown, UpdateNoteBody, unknown> = async (
	req,
	res,
	next
) => {
	const { noteId } = req.params;
	const { title: newTitle, text: newText } = req.body;
	const authenticatedUserId = req.session.userId;

	try {
		assertIsDefined(authenticatedUserId);

		if (!mongoose.isValidObjectId(noteId)) throw createHttpError(400, "Not valid id note");
		if (!newTitle) throw createHttpError(400, "Title required");

		const note = await NoteModel.findById(noteId).exec();

		if (!note) throw createHttpError(404, "Note not found");

		if (!note.userId.equals(authenticatedUserId)) throw createHttpError(401, "You cannot access this note");

		note.title = newTitle || note.title;
		note.text = newText || note.text;

		const updatedNote = await note.save(); // -> since we fetched already the note is enough to use this save( ) method to update the note

		res.status(200).json(updatedNote);
	} catch (error) {
		next(error);
	}
};

export const deleteNote: RequestHandler = async (req, res, next) => {
	const { noteId } = req.params;
	const authenticatedUserId = req.session.userId;

	try {
		assertIsDefined(authenticatedUserId);

		if (!mongoose.isValidObjectId(noteId)) throw createHttpError(400, "Not valid id note");

		const note = await NoteModel.findById(noteId);

		if (!note) throw createHttpError(404, "Note not found");

		if (!note.userId.equals(authenticatedUserId)) throw createHttpError(401, "You cannot access this note");

		await note.deleteOne();

		res.sendStatus(204);
	} catch (error) {
		next(error);
	}
};
