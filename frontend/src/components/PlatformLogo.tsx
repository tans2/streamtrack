interface PlatformLogoProps {
  providerId: number;
  providerName: string;
  logoPath?: string;
  size?: 'small' | 'medium' | 'large';
  showName?: boolean;
  className?: string;
}

export default function PlatformLogo({ 
  providerId, 
  providerName, 
  logoPath, 
  size = 'medium',
  showName = true,
  className = "" 
}: PlatformLogoProps) {
  // Simple emoji fallback for now
  const getEmoji = (name: string) => {
    const emojiMap: Record<string, string> = {
      'Netflix': '🔴',
      'Hulu': '🟢',
      'Disney+': '🔵',
      'Prime Video': '📦',
      'Paramount+': '🔷',
      'Peacock': '🦚',
      'HBO Max': '🟣',
      'Apple TV+': '🍎',
      'YouTube': '📺',
    };
    return emojiMap[name] || '📺';
  };

  const sizeClasses = {
    small: 'text-sm',
    medium: 'text-base',
    large: 'text-lg'
  };

  return (
    <span className={`inline-flex items-center space-x-1 ${sizeClasses[size]} ${className}`}>
      <span>{getEmoji(providerName)}</span>
      {showName && <span>{providerName}</span>}
    </span>
  );
}
