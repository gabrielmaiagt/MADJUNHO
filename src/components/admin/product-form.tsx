
"use client";

import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PlusCircle, Trash2 } from "lucide-react";
import type { Product } from "@/lib/types";
import { ScrollArea } from "../ui/scroll-area";

const productSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(3, "O nome deve ter pelo menos 3 caracteres."),
  price: z.preprocess(
    (a) => parseFloat(String(a).replace(',', '.')),
    z.number().positive("O preço deve ser um número positivo.")
  ),
  discount: z.preprocess(
    (a) => (a === "" || a === null ? null : parseFloat(String(a).replace(',', '.'))),
    z.number().min(0).max(100).nullable()
  ),
  description: z.string().min(10, "A descrição deve ter pelo menos 10 caracteres."),
  images: z.array(z.string().url("Deve ser uma URL válida de imagem ou vídeo.")).min(1, "Adicione pelo menos uma mídia."),
  testimonials: z.array(z.object({
    id: z.string(),
    name: z.string().min(2, "Nome do depoimento inválido"),
    avatarUrl: z.string().url("URL do avatar inválida"),
    rating: z.preprocess(a => parseInt(String(a), 10), z.number().min(1).max(5)),
    comment: z.string().min(5, "Comentário muito curto")
  })).nullable(),
});

type ProductFormValues = z.infer<typeof productSchema>;

type ProductFormProps = {
  product?: Product | null;
  onSubmit: (values: Product) => void;
  onCancel: () => void;
};

export function ProductForm({ product, onSubmit, onCancel }: ProductFormProps) {
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      id: product?.id || "",
      name: product?.name || "",
      price: product?.price || 0,
      discount: product?.discount || null,
      description: product?.description || "",
      images: product?.images || [""],
      testimonials: product?.testimonials?.map(t => ({...t, rating: Number(t.rating)})) || [],
    },
  });

  const { fields: imageFields, append: appendImage, remove: removeImage } = useFieldArray({
    control: form.control,
    name: "images",
  });
  
  const { fields: testimonialFields, append: appendTestimonial, remove: removeTestimonial } = useFieldArray({
    control: form.control,
    name: "testimonials",
  });

  function handleFormSubmit(values: ProductFormValues) {
    const finalValues: Product = {
        ...values,
        id: product?.id || values.id || `prod-${Date.now()}`,
        sold: product?.sold || 0,
        rating: product?.rating || 5, // Default new product rating
        checkoutUrl: product?.checkoutUrl || '',
        testimonials: values.testimonials || []
    };
    onSubmit(finalValues);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
        <ScrollArea className="h-[70vh] pr-4">
        <div className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome do Produto</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Foto com Nome" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
            <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Preço (R$)</FormLabel>
                <FormControl>
                    <Input type="text" inputMode='decimal' placeholder="19,90" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
             <FormField
            control={form.control}
            name="discount"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Desconto (%)</FormLabel>
                <FormControl>
                     <Input 
                        type="text" 
                        inputMode='decimal'
                        placeholder="Ex: 35"
                        {...field} 
                        value={field.value ?? ""}
                        onChange={e => field.onChange(e.target.value === '' ? null : e.target.value)}
                    />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição</FormLabel>
              <FormControl>
                <Textarea placeholder="Descreva o produto..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div>
            <FormLabel>Mídias (URLs de Imagens ou Vídeos)</FormLabel>
            <div className="space-y-2 mt-2">
            {imageFields.map((field, index) => (
                <FormField
                key={field.id}
                control={form.control}
                name={`images.${index}`}
                render={({ field }) => (
                    <FormItem>
                    <div className="flex items-center gap-2">
                        <FormControl>
                        <Input placeholder="https://..." {...field} />
                        </FormControl>
                         <Button type="button" variant="destructive" size="icon" onClick={() => removeImage(index)} disabled={imageFields.length <= 1}>
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                    <FormMessage />
                    </FormItem>
                )}
                />
            ))}
            </div>
            <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => appendImage("")}
            >
                <PlusCircle className="mr-2 h-4 w-4" />
                Adicionar Mídia
            </Button>
        </div>
        
        <div>
            <FormLabel>Depoimentos</FormLabel>
            <div className="space-y-4 mt-2">
                {testimonialFields.map((field, index) => (
                    <div key={field.id} className="p-3 border rounded-lg space-y-3 relative">
                         <Button type="button" variant="destructive" size="icon" className="absolute top-2 right-2 h-7 w-7" onClick={() => removeTestimonial(index)}>
                            <Trash2 className="h-4 w-4" />
                        </Button>
                        <FormField
                            control={form.control}
                            name={`testimonials.${index}.name`}
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-xs">Nome</FormLabel>
                                    <FormControl><Input placeholder="Carlos S." {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name={`testimonials.${index}.avatarUrl`}
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-xs">URL do Avatar</FormLabel>
                                    <FormControl><Input placeholder="https://..." {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name={`testimonials.${index}.rating`}
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-xs">Avaliação (1-5)</FormLabel>
                                    <FormControl><Input type="number" min="1" max="5" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name={`testimonials.${index}.comment`}
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-xs">Comentário</FormLabel>
                                    <FormControl><Textarea placeholder="Comentário..." {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                ))}
            </div>
             <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => appendTestimonial({ id: `testimonial-${Date.now()}`, name: '', avatarUrl: 'https://i.postimg.cc/d1hDjyqJ/laura.webp', rating: 5, comment: '' })}
            >
                <PlusCircle className="mr-2 h-4 w-4" />
                Adicionar Depoimento
            </Button>
        </div>
        </div>
        </ScrollArea>
        <div className="flex justify-end gap-2 pt-6">
          <Button type="button" variant="ghost" onClick={onCancel}>Cancelar</Button>
          <Button type="submit">Salvar Produto</Button>
        </div>
      </form>
    </Form>
  );
}
