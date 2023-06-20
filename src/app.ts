import "dotenv/config";
import express, { NextFunction, Request, Response } from "express";
import notesRoutes from "./routes/notes";
import userRoutes from "./routes/users";
import morgan from "morgan";
import createHttpError, { isHttpError } from "http-errors";
import session from "express-session";
import env from "./util/validateEnv";
import MongoStore from "connect-mongo";
import { requiresAuth } from "./middleware/auth";

const app = express();

app.use(morgan("dev"));

app.use(express.json());

app.use(
	session({
		secret: env.SESSION_SECRET,
		resave: false,
		saveUninitialized: false,
		cookie: {
			maxAge: 60 * 60 * 100, // -> How much time is gonna be valid the session
		},
		rolling: true, // -> Keep user connected and logged meanwhile is using the website
		store: MongoStore.create({
			// -> Where is gonna be saves the session
			mongoUrl: env.MONGO_CONNECTION_STRING,
		}),
	})
);

app.use("/api/users", userRoutes);
app.use("/api/notes", requiresAuth, notesRoutes);

/**
 * ##########################
 * ## Middleware Not Found ##
 * ##########################
 */

app.use((req, res, next) => {
	next(createHttpError(404, "Endpoint not found"));
});

/**
 * ######################
 * ## Middleware Error ##
 * ######################
 */

app.use((error: unknown, req: Request, res: Response, next: NextFunction) => {
	console.error(error);
	let errorMessage = "An unknown error occurred";
	let statusCode = 500;

	// if (error instanceof Error) errorMessage = error.message
	if (isHttpError(error)) {
		statusCode = error.status;
		errorMessage = error.message;
	}
	res.status(statusCode).json({ statusCode: statusCode, error: errorMessage });
});
export default app;
