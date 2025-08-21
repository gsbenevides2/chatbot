import { join } from "node:path";
import {
	author,
	description,
	license,
	name,
	repository,
	version,
} from "../../package.json";

const makeLicenseUrl = () => {
	const repoURl = new URL(repository.url);
	const repoPath = repoURl.pathname;
	const licensePath = join(repoPath, "/blob/main/LICENSE");
	return new URL(licensePath, repoURl).toString();
};

export const getProjectName = () => {
	return name
		.split("-")
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
		.join(" ");
};

export const getProjectInfo = () => {
	return {
		title: getProjectName(),
		description: description,
		version: version,
		contact: {
			name: author.name,
			email: author.email,
			url: author.url,
		},
		license: {
			url: makeLicenseUrl(),
			name: license,
		},
	};
};
