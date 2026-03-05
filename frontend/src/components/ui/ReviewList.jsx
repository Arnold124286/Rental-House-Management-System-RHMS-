import React from 'react';
import { Star, User } from 'lucide-react';
import clsx from 'clsx';

const ReviewList = ({ reviews }) => {
    if (!reviews || reviews.length === 0) {
        return (
            <div className="text-center py-8 bg-slate-900/30 rounded-2xl border border-dashed border-slate-800">
                <p className="text-slate-500 text-sm">No reviews yet. Be the first to leave one!</p>
            </div>
        );
    }

    return (
        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            {reviews.map((review) => (
                <div key={review.id} className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
                    <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700">
                                <User size={14} className="text-slate-400" />
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-white leading-none">{review.tenant_name}</h4>
                                <span className="text-[10px] text-slate-500">{new Date(review.created_at).toLocaleDateString()}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-0.5">
                            {[...Array(5)].map((_, i) => (
                                <Star
                                    key={i}
                                    size={12}
                                    className={clsx(
                                        i < review.rating ? "text-yellow-500 fill-yellow-500" : "text-slate-700"
                                    )}
                                />
                            ))}
                        </div>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed italic">
                        "{review.comment}"
                    </p>
                </div>
            ))}
        </div>
    );
};

export default ReviewList;
