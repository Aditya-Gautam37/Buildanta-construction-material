export class UpdateCategoryDTO {
    name?: string;
    parentId?: string | null;
    slug?: string;
    description?: string;
    imageUrl?: string;
    icon?: string;
    sortOrder?: number;
    featured?: boolean;
    published?: boolean;
    seoTitle?: string;
    seoDescription?: string;
}
