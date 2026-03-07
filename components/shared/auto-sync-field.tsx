"use client";

import { useState, useEffect, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, Loader2, Edit2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type FieldType = "input" | "textarea" | "select" | "switch" | "custom";

interface AutoSyncFieldProps<T = any> {
    // Valeur et onChange
    value: T;
    onChange: (value: T) => Promise<void> | void;

    // Configuration
    type?: FieldType;
    label?: string;
    placeholder?: string;
    disabled?: boolean;
    className?: string;

    // Mode de validation
    mode?: "auto" | "manual" | "form";
    debounceMs?: number; // pour mode auto

    // Validation
    validate?: (value: T) => string | undefined;
    required?: boolean;

    // États
    loading?: boolean;
    success?: boolean;
    error?: string;

    // Personnalisation
    renderInput?: (props: any) => ReactNode;
    children?: ReactNode;
    asChild?: boolean; // Pour utiliser le composant directement sans wrapper

    // Callbacks
    onSuccess?: () => void;
    onError?: (error: string) => void;
}

export function AutoSyncField<T = string>({
    value,
    onChange,
    type = "input",
    label,
    placeholder,
    disabled,
    className,
    mode = "manual",
    debounceMs = 500,
    validate,
    required,
    loading: externalLoading,
    success: externalSuccess,
    error: externalError,
    renderInput,
    children,
    onSuccess,
    onError,
    asChild = false,
}: AutoSyncFieldProps<T>) {
    const [internalValue, setInternalValue] = useState(value);
    const [internalLoading, setInternalLoading] = useState(false);
    const [internalSuccess, setInternalSuccess] = useState(false);
    const [internalError, setInternalError] = useState<string>();
    const [isEditing, setIsEditing] = useState(mode === "manual");

    const loading = externalLoading ?? internalLoading;
    const success = externalSuccess ?? internalSuccess;
    const error = externalError ?? internalError;

    // Reset success after 2 seconds
    useEffect(() => {
        if (success) {
            const timer = setTimeout(() => {
                setInternalSuccess(false);
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [success]);

    // Sync with external value
    useEffect(() => {
        setInternalValue(value);
    }, [value]);

    // Auto-save debounce
    useEffect(() => {
        if (mode !== "auto" || internalValue === value) return;

        const handler = setTimeout(async () => {
            await handleSave();
        }, debounceMs);

        return () => clearTimeout(handler);
    }, [internalValue, mode]);

    const handleSave = async () => {
        // Validation
        if (validate) {
            const validationError = validate(internalValue as any);
            if (validationError) {
                setInternalError(validationError);
                onError?.(validationError);
                return;
            }
        }

        setInternalLoading(true);
        setInternalError(undefined);

        try {
            await onChange(internalValue as T);
            setInternalSuccess(true);
            onSuccess?.();
            if (mode === "manual") {
                setIsEditing(false);
            }
        } catch (err: any) {
            setInternalError(err.message || "Une erreur est survenue");
            onError?.(err.message);
        } finally {
            setInternalLoading(false);
        }
    };

    const handleCancel = () => {
        setInternalValue(value);
        setIsEditing(false);
        setInternalError(undefined);
    };

    const renderField = () => {
        if (renderInput) {
            return renderInput({
                value: internalValue,
                onChange: setInternalValue,
                disabled: disabled || loading,
                placeholder,
            });
        }


        if (children) {
            return children;
        }

        switch (type) {
            case "textarea":
                return (
                    <Textarea
                        value={internalValue as string}
                        onChange={(e) => setInternalValue(e.target.value as T)}
                        placeholder={placeholder}
                        disabled={disabled || loading}
                        className="min-h-[100px]"
                    />
                );
            case "input":
            default:
                return (
                    <Input
                        value={internalValue as string}
                        onChange={(e) => setInternalValue(e.target.value as T)}
                        placeholder={placeholder}
                        disabled={disabled || loading}
                    />
                );
        }
    };

    // Dans le rendu conditionnel
    if (asChild && children) {
        return (
            <div className={cn("space-y-2", className)}>
                {label && (
                    <label className="text-sm font-medium flex items-center gap-2">
                        {label}
                        {required && <span className="text-destructive">*</span>}
                    </label>
                )}
                <div className="relative">
                    {children}
                </div>
            </div>
        );
    }

    return (
        <div className={cn("space-y-2", className)}>
            {label && (
                <label className="text-sm font-medium flex items-center gap-2">
                    {label}
                    {required && <span className="text-destructive">*</span>}
                </label>
            )}

            <div className="relative">
                {/* Field */}
                <div
                    className={cn(
                        "transition-all duration-200",
                        isEditing && "pr-24" // Space for buttons
                    )}
                >
                    {renderField()}
                </div>

                {/* Actions */}
                <AnimatePresence>
                    {isEditing && mode === "manual" && internalValue !== value && (
                        <motion.div
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 10 }}
                            className="absolute right-0 top-0 flex items-center gap-1 h-full"
                        >
                            <Button
                                size="icon"
                                variant="ghost"
                                onClick={handleSave}
                                disabled={loading || internalValue === value}
                                className="h-8 w-8"
                            >
                                {loading ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Check className="h-4 w-4 text-green-500" />
                                )}
                            </Button>
                            <Button
                                size="icon"
                                variant="ghost"
                                onClick={handleCancel}
                                disabled={loading}
                                className="h-8 w-8"
                            >
                                <X className="h-4 w-4 text-destructive" />
                            </Button>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Edit button for manual mode when not editing */}
                {mode === "manual" && !isEditing && (
                    <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setIsEditing(true)}
                        className="absolute right-0 top-0 h-8 w-8"
                    >
                        <Edit2 className="h-4 w-4" />
                    </Button>
                )}
            </div>

            {/* Feedback messages */}
            <AnimatePresence>
                {error && (
                    <motion.p
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="text-sm text-destructive flex items-center gap-1"
                    >
                        <X className="h-3 w-3" />
                        {error}
                    </motion.p>
                )}

                {success && !error && (
                    <motion.p
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="text-sm text-green-500 flex items-center gap-1"
                    >
                        <Check className="h-3 w-3" />
                        Modifications enregistrées
                    </motion.p>
                )}
            </AnimatePresence>
        </div>
    );
}