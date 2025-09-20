'use client';

import {zodResolver} from '@hookform/resolvers/zod';
import {
  Building2,
  Download,
  FileText,
  Image as ImageIcon,
  ImagePlus,
  LoaderCircle,
  Palette,
  Paperclip,
  Type,
  Upload,
  X,
} from 'lucide-react';
import Image from 'next/image';
import {useState, useEffect, useRef} from 'react';
import {useForm} from 'react-hook-form';
import * as z from 'zod';

import {generateMarketingAssetTemplates} from '@/app/actions';
import {Button} from '@/components/ui/button';
import {Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle} from '@/components/ui/card';
import {Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage} from '@/components/ui/form';
import {Input} from '@/components/ui/input';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select';
import {Textarea} from '@/components/ui/textarea';
import {useToast} from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

const imageFileSchema = z
  .any()
  .optional()
  .refine(files => !files || files.length === 0 || files?.[0]?.size <= MAX_FILE_SIZE, `Max file size is 5MB.`)
  .refine(
    files => !files || files.length === 0 || ACCEPTED_IMAGE_TYPES.includes(files?.[0]?.type),
    '.jpg, .jpeg, .png and .webp files are accepted.'
  );

const formSchema = z.object({
  logo: z
    .any()
    .refine(files => files?.length == 1, 'Logo is required.')
    .refine(files => files?.[0]?.size <= MAX_FILE_SIZE, `Max file size is 5MB.`)
    .refine(
      files => ACCEPTED_IMAGE_TYPES.includes(files?.[0]?.type),
      '.jpg, .jpeg, .png and .webp files are accepted.'
    ),
  businessName: z.string().min(2, {
    message: 'Business name must be at least 2 characters.',
  }),
  assetType: z.string().min(1, 'Please select an asset type.'),
  imageDescription: z.string().min(1, 'Image description is required.'),
  referenceImage1: imageFileSchema,
  referenceImage2: imageFileSchema,
  customText: z.string().optional(),
  colorPalette: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

const fileToDataUri = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export default function BrandBoostClient() {
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [downloadFormat, setDownloadFormat] = useState('png');
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [referenceImage1Preview, setReferenceImage1Preview] = useState<string | null>(null);
  const [referenceImage2Preview, setReferenceImage2Preview] = useState<string | null>(null);
  const {toast} = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      businessName: '',
      assetType: 'Social Media Post',
      imageDescription: '',
      customText: '',
      colorPalette: '',
    },
  });

  const logoFile = form.watch('logo');
  const referenceImage1File = form.watch('referenceImage1');
  const referenceImage2File = form.watch('referenceImage2');

  useEffect(() => {
    if (logoFile && logoFile.length > 0) {
      const file = logoFile[0];
      if (file instanceof File) {
        const previewUrl = URL.createObjectURL(file);
        setLogoPreview(previewUrl);
        return () => URL.revokeObjectURL(previewUrl);
      }
    } else {
      setLogoPreview(null);
    }
  }, [logoFile]);

  useEffect(() => {
    if (referenceImage1File && referenceImage1File.length > 0) {
      const file = referenceImage1File[0];
      if (file instanceof File) {
        const previewUrl = URL.createObjectURL(file);
        setReferenceImage1Preview(previewUrl);
        return () => URL.revokeObjectURL(previewUrl);
      }
    } else {
      setReferenceImage1Preview(null);
    }
  }, [referenceImage1File]);

  useEffect(() => {
    if (referenceImage2File && referenceImage2File.length > 0) {
      const file = referenceImage2File[0];
      if (file instanceof File) {
        const previewUrl = URL.createObjectURL(file);
        setReferenceImage2Preview(previewUrl);
        return () => URL.revokeObjectURL(previewUrl);
      }
    } else {
      setReferenceImage2Preview(null);
    }
  }, [referenceImage2File]);


  async function onSubmit(values: FormValues) {
    setIsLoading(true);
    setGeneratedImage(null);

    try {
      const logoFile = values.logo[0] as File;
      const businessLogoDataUri = await fileToDataUri(logoFile);

      const referenceImage1DataUri = values.referenceImage1?.[0]
        ? await fileToDataUri(values.referenceImage1[0])
        : undefined;
      const referenceImage2DataUri = values.referenceImage2?.[0]
        ? await fileToDataUri(values.referenceImage2[0])
        : undefined;

      const result = await generateMarketingAssetTemplates({
        businessLogoDataUri,
        businessName: values.businessName,
        assetType: values.assetType,
        imageDescription: values.imageDescription,
        customText: values.customText,
        colorPalette: values.colorPalette,
        referenceImage1DataUri,
        referenceImage2DataUri,
      });

      if (result && result.assetDataUri) {
        setGeneratedImage(result.assetDataUri);
        toast({
          title: 'Asset Generated!',
          description: 'Your new marketing asset is ready.',
        });
      } else {
        throw new Error('AI did not return an image.');
      }
    } catch (error) {
      console.error('Error generating asset:', error);
      toast({
        variant: 'destructive',
        title: 'Generation Failed',
        description: 'Could not generate the marketing asset. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  }

  const handleDownload = () => {
    if (!generatedImage) return;
    const link = document.createElement('a');

    const downloadWithFormat = (uri: string, format: 'png' | 'jpeg') => {
      link.href = uri;
      link.download = `${form.getValues('businessName') || 'brandboost'}-asset.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };

    if (downloadFormat === 'jpeg') {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new window.Image();
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        if (ctx) {
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0);
          const jpegDataUri = canvas.toDataURL('image/jpeg', 0.9);
          downloadWithFormat(jpegDataUri, 'jpeg');
        }
      };
      img.src = generatedImage;
    } else {
      downloadWithFormat(generatedImage, 'png');
    }
  };

  const ImagePreview = ({preview, onRemove}: {preview: string | null; onRemove: () => void}) => {
    if (!preview) return null;
    return (
      <div className="relative mt-2 h-24 w-24">
        <Image src={preview} alt="Preview" fill objectFit="contain" className="rounded-md border" />
        <Button
          type="button"
          variant="destructive"
          size="icon"
          className="absolute -right-2 -top-2 h-6 w-6 rounded-full"
          onClick={onRemove}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  };
  
  const FileUpload = ({field, className}: {field: any; className?: string;}) => {
    const inputRef = useRef<HTMLInputElement>(null);

    return (
      <FormControl>
        <div>
          <Input
            type="file"
            accept="image/png, image/jpeg, image/webp"
            className="hidden"
            ref={inputRef}
            onChange={e => field.onChange(e.target.files)}
          />
          <Button
            type="button"
            variant="outline"
            className={cn('w-full', className)}
            onClick={() => inputRef.current?.click()}
          >
            <Upload className="mr-2 h-4 w-4" />
            Upload
          </Button>
        </div>
      </FormControl>
    );
  };
    const ReferenceImageUpload = ({
    field,
    preview,
    onRemove,
  }: {
    field: any;
    preview: string | null;
    onRemove: () => void;
  }) => (
    <div className="flex-1">
      {preview ? (
        <ImagePreview preview={preview} onRemove={onRemove} />
      ) : (
        <FileUpload field={field} className="h-24" />
      )}
      <FormMessage />
    </div>
  );

  return (
    <div className="container mx-auto grid grid-cols-1 gap-8 p-4 md:grid-cols-3 md:p-6">
      <div className="md:col-span-1">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline text-xl">Customize Your Asset</CardTitle>
            <CardDescription>Fill in the details to generate a new marketing asset.</CardDescription>
          </CardHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="logo"
                  render={({field}) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <ImagePlus className="h-4 w-4" /> Business Logo
                      </FormLabel>
                      {logoPreview ? (
                        <ImagePreview
                          preview={logoPreview}
                          onRemove={() => form.setValue('logo', null, {shouldValidate: true})}
                        />
                      ) : (
                        <FileUpload field={field} />
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="businessName"
                  render={({field}) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" /> Business Name
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Creative Inc." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="assetType"
                  render={({field}) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <ImageIcon className="h-4 w-4" /> Asset Type
                      </FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select an asset type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Social Media Post">Social Media Post</SelectItem>
                          <SelectItem value="Website Banner">Website Banner</SelectItem>
                          <SelectItem value="Email Header">Email Header</SelectItem>
                          <SelectItem value="Flyer">Flyer</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="imageDescription"
                  render={({field}) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <FileText className="h-4 w-4" /> Image Description
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="e.g., Ganesh Chaturthi Festival post, 50% off sale post"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="space-y-2">
                  <FormLabel className="flex items-center gap-2">
                    <Paperclip className="h-4 w-4" /> Reference Images (optional)
                  </FormLabel>
                  <div className="flex gap-4">
                    <FormField
                      control={form.control}
                      name="referenceImage1"
                      render={({field}) => (
                        <FormItem className="flex-1">
                          <ReferenceImageUpload
                            field={field}
                            preview={referenceImage1Preview}
                            onRemove={() => form.setValue('referenceImage1', null, {shouldValidate: true})}
                          />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="referenceImage2"
                      render={({field}) => (
                        <FormItem className="flex-1">
                          <ReferenceImageUpload
                            field={field}
                            preview={referenceImage2Preview}
                            onRemove={() => form.setValue('referenceImage2', null, {shouldValidate: true})}
                          />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>


                <FormField
                  control={form.control}
                  name="customText"
                  render={({field}) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Type className="h-4 w-4" /> Additional Text (included in image)
                      </FormLabel>
                      <FormControl>
                        <Textarea placeholder="e.g., Grand Opening Sale! 50% Off!" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="colorPalette"
                  render={({field}) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Palette className="h-4 w-4" /> Color Palette (optional)
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., vibrant, pastel, monochrome" {...field} />
                      </FormControl>
                      <FormDescription>Describe the colors you want, e.g., "blue and gold".</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
              <CardFooter>
                <Button type="submit" disabled={isLoading} className="w-full bg-accent hover:bg-accent/90">
                  {isLoading ? (
                    <>
                      <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    'Generate Asset'
                  )}
                </Button>
              </CardFooter>
            </form>
          </Form>
        </Card>
      </div>

      <div className="md:col-span-2">
        <Card className="sticky top-20">
          <CardHeader>
            <CardTitle className="font-headline text-xl">Preview</CardTitle>
            <CardDescription>Your generated asset will appear here.</CardDescription>
          </CardHeader>
          <CardContent className="flex min-h-[400px] items-center justify-center rounded-lg border-2 border-dashed bg-muted/50 p-4">
            {isLoading ? (
              <div className="flex flex-col items-center gap-4 text-muted-foreground">
                <LoaderCircle className="h-12 w-12 animate-spin text-primary" />
                <p className="font-bold">Generating your masterpiece...</p>
                <p className="text-sm">This may take a moment.</p>
              </div>
            ) : generatedImage ? (
              <div className="relative aspect-square w-full max-w-full overflow-hidden rounded-lg p-2">
                <Image
                  src={generatedImage}
                  alt="Generated marketing asset"
                  fill
                  style={{objectFit: 'contain'}}
                />
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 text-center text-muted-foreground">
                <ImageIcon className="h-12 w-12" />
                <p className="font-bold">Ready to create?</p>
                <p className="text-sm">Fill out the form to generate your asset.</p>
              </div>
            )}
          </CardContent>
          <CardFooter className="justify-end gap-2">
            <Select onValueChange={setDownloadFormat} defaultValue={downloadFormat} disabled={!generatedImage}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="png">PNG</SelectItem>
                <SelectItem value="jpeg">JPEG</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleDownload} disabled={!generatedImage || isLoading}>
              <Download className="mr-2 h-4 w-4" />
              Download
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
