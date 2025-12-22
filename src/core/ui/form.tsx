"use client";

import { useForm, UseFormProps, FieldValues, FieldErrors } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ReactNode, useEffect } from "react";

interface FormProps<T extends FieldValues> {
  children: (methods: {
    register: ReturnType<typeof useForm<T>>['register'];
    formState: { errors: FieldErrors<T> };
  }) => ReactNode;
  validationSchema?: z.ZodSchema<T>;
  onSubmit: (data: T) => void;
  useFormProps?: UseFormProps<T>;
  resetValues?: T;
}

export function Form<T extends FieldValues>({
  children,
  validationSchema,
  onSubmit,
  useFormProps,
  resetValues,
}: FormProps<T>) {
  const methods = useForm<T>({
    ...useFormProps,
    resolver: validationSchema ? zodResolver(validationSchema) : undefined,
  });

  // Reset form values when resetValues changes
  useEffect(() => {
    if (resetValues) {
      methods.reset(resetValues);
    }
  }, [resetValues, methods]);

  const handleSubmit = methods.handleSubmit(onSubmit);

  return (
    <form onSubmit={handleSubmit}>
      {children({
        register: methods.register,
        formState: { errors: methods.formState.errors },
      })}
    </form>
  );
}
