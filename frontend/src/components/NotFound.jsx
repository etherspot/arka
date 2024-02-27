import { useEffect } from "react";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { UserAuth } from "../context/AuthContext";

const NotFound = () => {
	const { user } = UserAuth();
	const navigate = useNavigate();

	useEffect(() => {
		if (!user) {
			toast.error("no such user exists");
			navigate("/");
		}
	}, [user, navigate]);

	return (
		<div>
			<h1>Page Not Found</h1>
		</div>
	);
};

export default NotFound;
