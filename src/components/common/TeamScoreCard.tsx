import React from 'react';

interface TeamScoreCardProps {
  teamName: string;
  rank?: number;
  totalScore: number;
  memberCount?: number;
}

export const TeamScoreCard: React.FC<TeamScoreCardProps> = ({
  teamName,
  rank,
  totalScore,
  memberCount,
}) => {
  return (
    <div className="flex items-center justify-between p-4 bg-card rounded-lg border border-border shadow-[0_1px_2px_rgba(0,0,0,0.03)] hover:bg-bg transition">
      <div className="flex items-center space-x-3">
        {rank && (
          <div className="w-8 h-8 rounded-full bg-bg border border-border text-text-primary flex items-center justify-center type-caption font-bold">
            #{rank}
          </div>
        )}
        <div>
          <h4 className="type-h5 font-bold text-text-primary">{teamName}</h4>
          {memberCount !== undefined && (
            <p className="type-caption text-text-muted font-medium">{memberCount} Members</p>
          )}
        </div>
      </div>
      <div className="text-right">
        <span className="type-h4 text-accent font-bold">{totalScore}</span>
        <span className="type-fine text-text-muted font-medium block">Total Points</span>
      </div>
    </div>
  );
};

export default TeamScoreCard;
