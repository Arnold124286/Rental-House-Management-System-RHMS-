import React, { useState } from 'react';
import { Star, Send } from 'lucide-react';
import { reviewsAPI } from '../../services/api';
import toast from 'react-hot-toast';
import clsx from 'clsx';

const ReviewForm = ({ propertyId, onReviewSubmitted }) => {
    const [rating, setRating] = useState(0);
    const [hover, setHover] = useState(0);
    const [comment, setComment] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (rating === 0) return toast.error('Please select a star rating.');

        setLoading(true);
        try {
            await reviewsAPI.create({
                property_id: propertyId,
                rating,
                comment
            });
            toast.success('Thank you for your review!');
            setRating(0);
            setComment('');
            if (onReviewSubmitted) onReviewSubmitted();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to submit review.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="p-4 bg-primary-950/20 border border-primary-900/30 rounded-2xl">
            <h4 className="text-sm font-bold text-white mb-4">Leave a Review</h4>

            <div className="flex items-center gap-2 mb-4">
                {[...Array(5)].map((_, i) => {
                    const starValue = i + 1;
                    return (
                        <button
                            key={i}
                            type="button"
                            className="focus:outline-none transition-transform hover:scale-110"
                            onClick={() => setRating(starValue)}
                            onMouseEnter={() => setHover(starValue)}
                            onMouseLeave={() => setHover(0)}
                        >
                            <Star
                                size={24}
                                className={clsx(
                                    "transition-colors",
                                    (hover || rating) >= starValue
                                        ? "text-yellow-500 fill-yellow-500"
                                        : "text-slate-700"
                                )}
                            />
                        </button>
                    );
                })}
                <span className="text-xs text-slate-500 font-medium ml-2">
                    {rating > 0 ? `${rating} / 5 Stars` : 'Select rating'}
                </span>
            </div>

            <div className="relative">
                <textarea
                    className="input min-h-[80px] text-xs resize-none pr-10"
                    placeholder="Share your experience staying here..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    required
                />
                <button
                    type="submit"
                    disabled={loading}
                    className="absolute bottom-2 right-2 w-8 h-8 bg-primary-600 hover:bg-primary-500 disabled:bg-slate-800 text-white rounded-lg flex items-center justify-center transition-colors shadow-lg"
                >
                    {loading ? (
                        <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                        <Send size={14} />
                    )}
                </button>
            </div>
        </form>
    );
};

export default ReviewForm;
