"use client";

import { useState, useEffect, useRef, useCallback, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, Loader2, Edit2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type FieldType = "input" | "textarea" | "select" | "switch" | "custom";
type EditMode = "auto" | "manual" | "blur";
type EditTrigger = "click" | "double-click" | "manual";

interface AutoSyncFieldProps<T = any> {
    // Valeur et onChange
    value: T;
    onChange: (value: T) => Promise<void> | void;

    // Rendu (remplace children)
    renderDisplay?: (value: T, isHovered?: boolean) => ReactNode;
    renderEdit?: (props: {
        value: T;
        onChange: (value: T) => void;
        disabled?: boolean;
        placeholder?: string;
        autoFocus?: boolean;
        onKeyDown?: (e: React.KeyboardEvent) => void;
        onBlur?: () => void;
    }) => ReactNode;

    // Configuration
    type?: FieldType;
    label?: string;
    placeholder?: string;
    disabled?: boolean;
    className?: string;
    containerClassName?: string;

    // Mode d'édition et déclenchement
    editMode?: EditMode;
    editTrigger?: EditTrigger;
    debounceMs?: number; // pour mode auto

    // Validation
    validate?: (value: T) => string | undefined;
    required?: boolean;

    // États
    loading?: boolean;
    success?: boolean;
    error?: string;

    // Callbacks
    onSuccess?: () => void;
    onError?: (error: string) => void;
    onEditStart?: () => void;
    onEditCancel?: () => void;
    onEditSave?: () => void;

    // Contrôle externe de l'état d'édition
    isEditing?: boolean;
    onEditingChange?: (isEditing: boolean) => void;

    // UX
    showEditButton?: boolean;
    editButtonClassName?: string;
    successDuration?: number;
    autoFocus?: boolean;
}

export function AutoSyncField<T = string>({
    value,
    onChange,
    renderDisplay,
    renderEdit,
    type = "input",
    label,
    placeholder,
    disabled = false,
    className,
    containerClassName,
    editMode = "manual",
    editTrigger = "double-click",
    debounceMs = 500,
    validate,
    required = false,
    loading: externalLoading,
    success: externalSuccess,
    error: externalError,
    onSuccess,
    onError,
    onEditStart,
    onEditCancel,
    onEditSave,
    isEditing: externalIsEditing,
    onEditingChange,
    showEditButton = true,
    editButtonClassName,
    successDuration = 2000,
    autoFocus = true,
}: AutoSyncFieldProps<T>) {
    // États internes
    const [internalValue, setInternalValue] = useState(value);
    const [internalLoading, setInternalLoading] = useState(false);
    const [internalSuccess, setInternalSuccess] = useState(false);
    const [internalError, setInternalError] = useState<string>();
    const [internalIsEditing, setInternalIsEditing] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    
    // Refs
    const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);
    const previousValueRef = useRef(value);
    const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const successTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // États dérivés
    const loading = externalLoading ?? internalLoading;
    const success = externalSuccess ?? internalSuccess;
    const error = externalError ?? internalError;
    const isEditing = externalIsEditing ?? internalIsEditing;
    const isDirty = internalValue !== value;
    const isValid = !validate || !validate(internalValue as any);

    // Sync avec la valeur externe
    useEffect(() => {
        if (!isEditing) {
            setInternalValue(value);
        }
        previousValueRef.current = value;
    }, [value, isEditing]);

    // Reset success après délai
    useEffect(() => {
        if (success) {
            successTimeoutRef.current = setTimeout(() => {
                setInternalSuccess(false);
            }, successDuration);
            return () => {
                if (successTimeoutRef.current) {
                    clearTimeout(successTimeoutRef.current);
                }
            };
        }
    }, [success, successDuration]);

    // Auto-save debounce
    useEffect(() => {
        if (editMode !== "auto" || !isEditing || !isDirty) return;

        if (debounceTimeoutRef.current) {
            clearTimeout(debounceTimeoutRef.current);
        }

        debounceTimeoutRef.current = setTimeout(async () => {
            await handleSave();
        }, debounceMs);

        return () => {
            if (debounceTimeoutRef.current) {
                clearTimeout(debounceTimeoutRef.current);
            }
        };
    }, [internalValue, editMode, isEditing, isDirty]);

    // Auto-focus quand on entre en mode édition
    useEffect(() => {
        if (isEditing && autoFocus && inputRef.current) {
            // Petit délai pour permettre au DOM de se mettre à jour
            setTimeout(() => {
                inputRef.current?.focus();
            }, 50);
        }
    }, [isEditing, autoFocus]);

    // Handlers
    const handleSave = useCallback(async () => {
        // Ne pas sauvegarder si pas de changement
        if (!isDirty) {
            if (editMode === "manual") {
                setInternalIsEditing(false);
                onEditingChange?.(false);
            }
            return;
        }

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
            // Optimistic UI: on sauvegarde d'abord en mémoire
            const previousValue = previousValueRef.current;
            
            await onChange(internalValue as T);
            
            setInternalSuccess(true);
            onSuccess?.();
            onEditSave?.();
            
            if (editMode === "manual") {
                setInternalIsEditing(false);
                onEditingChange?.(false);
            }
        } catch (err: any) {
            // Rollback en cas d'erreur
            setInternalValue(previousValueRef.current);
            setInternalError(err.message || "Une erreur est survenue");
            onError?.(err.message);
        } finally {
            setInternalLoading(false);
        }
    }, [internalValue, value, isDirty, validate, onChange, onSuccess, onError, onEditSave, editMode, onEditingChange]);

    const handleCancel = useCallback(() => {
        setInternalValue(value);
        setInternalError(undefined);
        setInternalIsEditing(false);
        onEditingChange?.(false);
        onEditCancel?.();
    }, [value, onEditingChange, onEditCancel]);

    const handleStartEdit = useCallback(() => {
        if (disabled || loading) return;
        setInternalIsEditing(true);
        onEditingChange?.(true);
        onEditStart?.();
    }, [disabled, loading, onEditingChange, onEditStart]);

    const handleBlur = useCallback(async () => {
        if (editMode === "blur" && isDirty && isValid) {
            await handleSave();
        } else if (editMode === "blur" && !isDirty) {
            setInternalIsEditing(false);
            onEditingChange?.(false);
        }
    }, [editMode, isDirty, isValid, handleSave, onEditingChange]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey && type !== "textarea") {
            e.preventDefault();
            if (editMode === "manual") {
                handleSave();
            } else {
                handleSave();
                setInternalIsEditing(false);
                onEditingChange?.(false);
            }
        }
        if (e.key === "Escape") {
            e.preventDefault();
            handleCancel();
        }
    }, [handleSave, handleCancel, editMode, type, onEditingChange]);

    // Rendu du mode display
    const renderDisplayMode = () => {
        if (renderDisplay) {
            return renderDisplay(value, isHovered);
        }
        
        // Fallback: afficher la valeur en texte simple
        if (value === undefined || value === null || value === "") {
            return (
                <span className="text-muted-foreground italic">
                    Non renseigné
                </span>
            );
        }
        
        return <span>{String(value)}</span>;
    };

    // Rendu du mode edit
    const renderEditMode = () => {
        if (renderEdit) {
            return renderEdit({
                value: internalValue,
                onChange: setInternalValue,
                disabled: disabled || loading,
                placeholder,
                autoFocus,
                onKeyDown: handleKeyDown,
                onBlur: handleBlur,
            });
        }

        // Fallback avec le type par défaut
        const commonProps = {
            value: internalValue as string,
            onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => 
                setInternalValue(e.target.value as T),
            placeholder,
            disabled: disabled || loading,
            onKeyDown: handleKeyDown,
            onBlur: handleBlur,
            ref: inputRef as any,
            className: cn(
                "transition-all duration-200",
                loading && "opacity-50"
            ),
        };

        switch (type) {
            case "textarea":
                return <Textarea {...commonProps} className={cn("min-h-[80px]", commonProps.className)} />;
            case "input":
            default:
                return <Input {...commonProps} />;
        }
    };

    // Déterminer le trigger d'édition
    const getTriggerProps = () => {
        if (disabled || loading || isEditing) return {};
        
        if (editTrigger === "click") {
            return { onClick: handleStartEdit };
        }
        if (editTrigger === "double-click") {
            return { onDoubleClick: handleStartEdit };
        }
        return {};
    };

    return (
        <div className={cn("space-y-2", containerClassName)}>
            {/* Label */}
            {label && (
                <label className="text-sm font-medium flex items-center gap-2">
                    {label}
                    {required && <span className="text-destructive">*</span>}
                    {loading && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
                </label>
            )}

            {/* Champ principal */}
            <div 
                className={cn("relative group", className)}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                {!isEditing ? (
                    // MODE DISPLAY
                    <div
                        {...getTriggerProps()}
                        className={cn(
                            "cursor-pointer transition-all duration-200 rounded-md",
                            editTrigger !== "manual" && "hover:bg-muted/30 hover:ring-1 hover:ring-primary/20",
                            "px-2 py-1.5"
                        )}
                    >
                        {renderDisplayMode()}
                    </div>
                ) : (
                    // MODE EDIT
                    <div className="relative">
                        {renderEditMode()}
                        
                        {/* Boutons d'action pour mode manual */}
                        {editMode === "manual" && isDirty && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 bg-background rounded-md shadow-sm"
                            >
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={handleSave}
                                    disabled={loading || !isValid}
                                    className="h-7 w-7 hover:bg-green-500/10"
                                >
                                    {loading ? (
                                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    ) : (
                                        <Check className="h-3.5 w-3.5 text-green-500" />
                                    )}
                                </Button>
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={handleCancel}
                                    disabled={loading}
                                    className="h-7 w-7 hover:bg-destructive/10"
                                >
                                    <X className="h-3.5 w-3.5 text-destructive" />
                                </Button>
                            </motion.div>
                        )}
                    </div>
                )}

                {/* Bouton d'édition manuel */}
                {showEditButton && !isEditing && editTrigger !== "manual" && !disabled && !loading && (
                    <Button
                        size="icon"
                        variant="ghost"
                        onClick={handleStartEdit}
                        className={cn(
                            "absolute right-0 top-1/2 -translate-y-1/2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity",
                            editButtonClassName
                        )}
                    >
                        <Edit2 className="h-3.5 w-3.5" />
                    </Button>
                )}
            </div>

            {/* Messages d'erreur et de succès */}
            <AnimatePresence mode="wait">
                {error && (
                    <motion.div
                        key="error"
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        className="text-sm text-destructive flex items-center gap-1.5"
                    >
                        <AlertCircle className="h-3.5 w-3.5" />
                        <span>{error}</span>
                    </motion.div>
                )}

                {success && !error && (
                    <motion.div
                        key="success"
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        className="text-sm text-green-500 flex items-center gap-1.5"
                    >
                        <Check className="h-3.5 w-3.5" />
                        <span>Modifications enregistrées</span>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// Export du type pour utilisation externe
export type { EditMode, EditTrigger, AutoSyncFieldProps };