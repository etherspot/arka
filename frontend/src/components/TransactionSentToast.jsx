import toast from "react-hot-toast";

const TransactionSentToast = ({ t, blockExplorerLink, txHash }) => {
	const openInExplorer = (txHash) => {
		window.open(`${blockExplorerLink}${txHash}`, "_blank");
	};

	return (
		<div className="flex">
			<b className="justify-center align-middle">Transaction Sent</b>
			<button
				className="font-medium text-sm rounded-full text-blue-600 ml-4 mr-4"
				onClick={() => {
					openInExplorer(txHash);
					toast.dismiss(t.id);
				}}
			>
				Open in Explorer
			</button>
			<button
				className="text-md font-bold text-red-600"
				onClick={() => toast.dismiss(t.id)}
			>
				x
			</button>
		</div>
	);
};

export default TransactionSentToast;
