import { describe, expect, it } from 'vitest';
import {
  getForwardSupportInquiryStatusOptions,
  isTerminalSupportInquiryStatus,
  normalizeSupportInquiryStatus,
} from './supportInquiryStatus';

describe('getForwardSupportInquiryStatusOptions (support tickets)', () => {
  it('never offers New after Open', () => {
    const values = getForwardSupportInquiryStatusOptions('Open', 'Support').map((o) => o.value);
    expect(values).not.toContain('New');
    expect(values).toEqual(['InProgress', 'OnHold', 'Resolved', 'Closed']);
  });

  it('offers only later steps from InProgress', () => {
    const values = getForwardSupportInquiryStatusOptions('InProgress', 'Support').map((o) => o.value);
    expect(values).toEqual(['OnHold', 'Resolved', 'Closed']);
  });

  it('offers Reopen and Closed from Resolved', () => {
    const values = getForwardSupportInquiryStatusOptions('Resolved', 'Support').map((o) => o.value);
    expect(values[0]).toBe('Open');
    expect(values).toContain('Closed');
  });

  it('offers only Reopen from Closed', () => {
    const values = getForwardSupportInquiryStatusOptions('Closed', 'Support').map((o) => o.value);
    expect(values).toEqual(['Open']);
  });
});

describe('getForwardSupportInquiryStatusOptions (feedback)', () => {
  it('offers Reviewed and Actioned from New', () => {
    const values = getForwardSupportInquiryStatusOptions('New', 'Feedback').map((o) => o.value);
    expect(values).toEqual(['Reviewed', 'Actioned']);
  });

  it('offers Actioned from Reviewed', () => {
    const values = getForwardSupportInquiryStatusOptions('Reviewed', 'Feedback').map((o) => o.value);
    expect(values).toEqual(['Actioned']);
  });

  it('offers reopen from Actioned', () => {
    const values = getForwardSupportInquiryStatusOptions('Actioned', 'Feedback').map((o) => o.value);
    expect(values).toEqual(['Reviewed']);
  });
});

describe('normalizeSupportInquiryStatus', () => {
  it('maps legacy support statuses for feedback rows', () => {
    expect(normalizeSupportInquiryStatus('InProgress', 'Feedback')).toBe('Reviewed');
    expect(normalizeSupportInquiryStatus('Resolved', 'Feedback')).toBe('Actioned');
  });

  it('treats Actioned as terminal for feedback only', () => {
    expect(isTerminalSupportInquiryStatus('Actioned', 'Feedback')).toBe(true);
    expect(isTerminalSupportInquiryStatus('Actioned', 'Support')).toBe(false);
    expect(isTerminalSupportInquiryStatus('Resolved', 'Support')).toBe(true);
  });
});
