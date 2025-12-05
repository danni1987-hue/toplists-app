import { Card } from "./ui/card";
import { Avatar } from "./ui/avatar";
import { Button } from "./ui/button";
import { Eye, Circle } from "lucide-react";
import { getCategoryIcon } from "../utils/categoryIcons";

interface TopListPreviewProps {
  id: string;
  author: {
    name: string;
    avatar: string;
    username: string;
    userId?: string;
  };
  title: string;
  description: string;
  category: string;
  genre?: string;
  timestamp: string;
  coverImage?: string;
  onViewDetail: (id: string) => void;
}

export function TopListPreview({
  id,
  author,
  title,
  description,
  category,
  genre,
  timestamp,
  coverImage,
  onViewDetail,
}: TopListPreviewProps) {
  const CategoryIcon = getCategoryIcon(category);

  return (
    <Card className="overflow-hidden border-border bg-card hover:shadow-lg transition-shadow">
      {/* Header */}
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1">
          <Avatar className="h-10 w-10">
            <img src={author.avatar} alt={author.name} className="object-cover" />
          </Avatar>
          <div className="flex-1">
            <p className="font-medium">{author.name}</p>
            <p className="text-sm text-muted-foreground">@{author.username} · {timestamp}</p>
          </div>
        </div>
      </div>

      {/* Cover Image */}
      {coverImage && (
        <div className="w-full h-48 overflow-hidden bg-muted">
          <img src={coverImage} alt={title} className="w-full h-full object-cover" />
        </div>
      )}

      {/* Content */}
      <div className="p-4">
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full flex items-center gap-1">
            <CategoryIcon className="h-3 w-3" />
            {category}
          </span>
          {genre && (
            <>
              <Circle className="h-1 w-1 fill-current text-muted-foreground" />
              <span className="text-xs text-muted-foreground">{genre}</span>
            </>
          )}
        </div>
        
        <h3 className="mb-2">{title}</h3>
        <p className="text-muted-foreground text-sm line-clamp-2 mb-4">
          {description}
        </p>

        <Button 
          onClick={() => onViewDetail(id)}
          variant="outline"
          className="w-full"
        >
          <Eye className="h-4 w-4 mr-2" />
          Ver Lista Completa
        </Button>
      </div>
    </Card>
  );
}
