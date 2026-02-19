import {
    PROGRESS_INCREMENT,
    PROGRESS_INTERVAL_MS,
    REDIRECT_DELAY_MS,
} from "lib/constants";
import { CheckCircle2, Image, UploadIcon } from "lucide-react";
import { useCallback, useState, type ChangeEvent, type DragEvent } from "react";
import { useOutletContext } from "react-router";

interface UploadProps {
    onComplete?: (base64Data: string) => void;
}

const Upload = ({ onComplete }: UploadProps) => {
    const [file, setFile] = useState<File | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [progress, setProgress] = useState(0);

    const { isSignedIn } = useOutletContext<AuthContext>();

    const processFile = useCallback(
        (file: File) => {
            if (!isSignedIn) return;

            setFile(file);
            setProgress(0);

            const reader = new FileReader();
            reader.onloadend = () => {
                const base64Data = reader.result as string;

                const interval = setInterval(() => {
                    setProgress((prev) => {
                        const next = prev + PROGRESS_INCREMENT;
                        if (next >= 100) {
                            clearInterval(interval);
                            setTimeout(() => {
                                onComplete?.(base64Data);
                            }, REDIRECT_DELAY_MS);
                            return 100;
                        }

                        return next;
                    });
                }, PROGRESS_INTERVAL_MS);
            };

            reader.readAsDataURL(file);
        },
        [isSignedIn, onComplete],
    );

    const handleDragOver = (e: DragEvent) => {
        e.preventDefault();
        if (!isSignedIn) return;
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (e: DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        if (!isSignedIn) return;

        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile && droppedFile.type.startsWith("image/")) {
            processFile(droppedFile);
        }
    };

    const handleOnChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (!isSignedIn) return false;

        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            processFile(selectedFile);
        }
    };

    console.log("Progress >>>> ", progress);

    return (
        <div className="upload">
            {!file ? (
                <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`dropzone ${isDragging ? "is-dragging" : ""}`}
                >
                    <input
                        type="file"
                        className="drop-input"
                        accept=".jpg,.jpeg,.png"
                        disabled={!isSignedIn}
                        onChange={handleOnChange}
                    />

                    <div className="drop-content">
                        <div className="drop-icon">
                            <UploadIcon size={20} />
                        </div>
                        <p>
                            {isSignedIn
                                ? "Click to upload or just drag and drop"
                                : "Sign in or sign up with Puter to upload"}
                        </p>
                        <p className="help">Maximum file size 50MB.</p>
                    </div>
                </div>
            ) : (
                <div className="upload-status">
                    <div className="status-content">
                        <div className="status-icon">
                            {progress === 100 ? (
                                <CheckCircle2 className="check" />
                            ) : (
                                <Image className="image" />
                            )}
                        </div>

                        <h3>{file.name}</h3>

                        <div className="progress">
                            <div
                                style={{ width: `${progress}%` }}
                                className="bar"
                            />

                            <p className="status-text">
                                {progress < 100
                                    ? "Analyzing Floor Plan..."
                                    : "Redirecting..."}
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Upload;
