import React from 'react';

/** Red asterisk marking a required form field. */
export function ReqMark() {
    return <span className="text-red-500 ml-0.5" title="Zorunlu alan">*</span>;
}

/** Small legend shown in a dialog explaining the required marker. */
export function RequiredLegend() {
    return (
        <p className="text-[11px] text-gray-400">
            <span className="text-red-500">*</span> işaretli alanlar zorunludur.
        </p>
    );
}
