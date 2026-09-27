UPDATE public.articles
SET publication_status = 'archived',
    validation_status = 'rejected',
    validation_notes = 'Archived pending re-validation; article predates the reliable-source validation engine.'
WHERE validation_status = 'legacy_unvalidated';
