// components/shared/auto-sync-field.tsx
"use client";

import { useState, useEffect, useRef, useCallback, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, Loader2, Edit2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

type FieldType = "input" | "textarea" | "select" | "switch" | "date" | "number" | "custom";
type EditMode = "auto" | "manual" | "blur";
type EditTrigger = "click" | "double-click" | "manual";

interface AutoSyncFieldProps<T = any> {
    value: T;
    onChange: (value: T) => Promise<void> | void;
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
    type?: FieldType;
    label?: string;
    placeholder?: string;
    disabled?: boolean;
    className?: string;
    containerClassName?: string;
    options?: { label: string; value: string | number }[];
    editMode?: EditMode;
    editTrigger?: EditTrigger;
    debounceMs?: number;
    validate?: (value: T) => string | undefined;
    required?: boolean;
    loading?: boolean;
    success?: boolean;
    error?: string;
    onSuccess?: () => void;
    onError?: (error: string) => void;
    onEditStart?: () => void;
    onEditCancel?: () => void;
    onEditSave?: () => void;
    isEditing?: boolean;
    onEditingChange?: (isEditing: boolean) => void;
    showEditButton?: boolean;
    editButtonClassName?: string;
    successDuration?: number;
    autoFocus?: boolean;
    children?: ReactNode;
    asChild?: boolean;
    mode?: EditMode;
    helperText?: string;
    icon?: React.ComponentType<any>;
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
    options = [],
    children,
    asChild = false,
    mode,
    helperText,
    icon: Icon,
}: AutoSyncFieldProps<T>) {
    const [internalValue, setInternalValue] = useState(value);
    const [internalLoading, setInternalLoading] = useState(false);
    const [internalSuccess, setInternalSuccess] = useState(false);
    const [internalError, setInternalError] = useState<string>();
    const [internalIsEditing, setInternalIsEditing] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    
    const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);
    const previousValueRef = useRef(value);
    const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const successTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const loading = externalLoading ?? internalLoading;
    const success = externalSuccess ?? internalSuccess;
    const error = externalError ?? internalError;
    
    const mode_is_legacy_manual = mode === "manual";
    const isDirty = internalValue !== value;
    const isValid = !validate || !validate(internalValue as any);
    const isEditing = (externalIsEditing ?? internalIsEditing) || (mode_is_legacy_manual && !asChild);

    useEffect(() => {
        if (!isEditing) {
            setInternalValue(value);
        }
        previousValueRef.current = value;
    }, [value, isEditing]);

    useEffect(() => {
        if (success) {
            successTimeoutRef.current = setTimeout(() => {
                setInternalSuccess(false);
            }, successDuration);
            return () => {
                if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current);
            };
        }
    }, [success, successDuration]);

    useEffect(() => {
        const actualEditMode = mode === "auto" ? "auto" : editMode;
        if (actualEditMode !== "auto" || !isDirty) return;

        if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);

        debounceTimeoutRef.current = setTimeout(async () => {
            await handleSave();
        }, debounceMs);

        return () => {
            if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);
        };
    }, [internalValue, editMode, mode, isDirty]);

    useEffect(() => {
        if (isEditing && autoFocus && inputRef.current) {
            setTimeout(() => {
                inputRef.current?.focus();
            }, 50);
        }
    }, [isEditing, autoFocus]);

    const handleSave = useCallback(async () => {
        if (!isDirty) {
            if (editMode === "manual" || mode_is_legacy_manual) {
                setInternalIsEditing(false);
                onEditingChange?.(false);
            }
            return;
        }

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
            onEditSave?.();
            if (editMode === "manual" || mode_is_legacy_manual) {
                setInternalIsEditing(false);
                onEditingChange?.(false);
            }
        } catch (err: any) {
            setInternalValue(previousValueRef.current);
            setInternalError(err.message || "Une erreur est survenue");
            onError?.(err.message);
        } finally {
            setInternalLoading(false);
        }
    }, [internalValue, isDirty, validate, onChange, onSuccess, onError, onEditSave, editMode, mode_is_legacy_manual, onEditingChange]);

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
            handleSave();
        }
        if (e.key === "Escape") {
            e.preventDefault();
            handleCancel();
        }
    }, [handleSave, handleCancel, type]);

    const renderDisplayMode = () => {
        if (renderDisplay) return renderDisplay(value, isHovered);
        if (value === undefined || value === null || value === "") {
            return <span className="text-muted-foreground italic">Non renseigné</span>;
        }
        if (type === "switch") {
            return (
                <div className="flex items-center gap-2">
                    <Switch checked={!!value} disabled />
                    <span className="text-sm">{value ? "Activé" : "Désactivé"}</span>
                </div>
            );
        }
        if (type === "select" && options.length > 0) {
            const option = options.find(o => o.value === value);
            return <span>{option?.label || String(value)}</span>;
        }
        return <span>{String(value)}</span>;
    };

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

        if (children) return children;

        // Fallback avec le type par défaut
        const commonProps = {
            value: internalValue as string,
            onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
                const val = e.target.value;
                if (type === "number") {
                    setInternalValue(Number(val) as any);
                } else {
                    setInternalValue(val as any);
                }
            },
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
            case "switch":
                return (
                    <div className="flex items-center gap-2 py-2">
                        <Switch 
                            checked={!!internalValue} 
                            onCheckedChange={(checked) => {
                                setInternalValue(checked as any);
                                if (editMode === "auto" || (arguments[0] as any).mode === "auto") handleSave();
                            }}
                            disabled={disabled || loading}
                        />
                        <span className="text-sm text-muted-foreground">
                            {internalValue ? "Activé" : "Désactivé"}
                        </span>
                    </div>
                );
            case "select":
                return (
                    <Select 
                        value={String(internalValue)} 
                        onValueChange={(val) => {
                            setInternalValue(val as any);
                            if (editMode === "auto" || (arguments[0] as any).mode === "auto") handleSave();
                        }}
                        disabled={disabled || loading}
                    >
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder={placeholder} />
                        </SelectTrigger>
                        <SelectContent>
                            {options.map((opt) => (
                                <SelectItem key={opt.value} value={String(opt.value)}>
                                    {opt.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                );
            case "date":
                return <Input {...commonProps} type="date" />;
            case "number":
                return <Input {...commonProps} type="number" />;
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
        // Support for old mode="manual" which was default the display
        if (mode_is_legacy_manual) return { onClick: handleStartEdit };

        return {};
    };

    if (asChild && children) {
        return (
            <div className={cn("space-y-2", containerClassName)}>
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
        <div className={cn("space-y-2", containerClassName)}>
            {/* Label */}
                {label && (
                    <label className="text-sm font-medium flex items-center gap-2">
                        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
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
                            (editTrigger !== "manual" || mode_is_legacy_manual) && "hover:bg-muted/30 hover:ring-1 hover:ring-primary/20",
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
                        {(editMode === "manual" || mode_is_legacy_manual) && isDirty && (
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
                {showEditButton && !isEditing && (editTrigger !== "manual" || mode_is_legacy_manual) && !disabled && !loading && (
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

            {helperText && (
                <p className="text-xs text-muted-foreground leading-relaxed">
                    {helperText}
                </p>
            )}
        </div>
    );
}

export type { EditMode, EditTrigger, AutoSyncFieldProps };