import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";

const app = express();

app.use(helmet());
app.use(
	cors({
		origin: true,
		credentials: true,
	})
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get("/", (req, res) => {
	res.json({ message: "Backend is running" });
});

app.get("/health", (req, res) => {
	res.json({ status: "ok" });
});

export default app;
