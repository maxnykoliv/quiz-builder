import { zodResolver } from '@hookform/resolvers/zod';
import { FormProvider, useFieldArray, useForm } from 'react-hook-form';
import { PlusIcon } from '@/components/icons';
import { createEmptyQuestion, defaultQuizFormValues, quizFormSchema } from '@/lib/quizForm';
import type { QuizFormValues } from '@/lib/quizForm';
import { QuestionEditor } from './QuestionEditor';

type QuizFormProps = {
  onSubmit: (values: QuizFormValues) => Promise<void>;
  submitError?: string | null;
};

export function QuizForm({ onSubmit, submitError }: QuizFormProps) {
  const methods = useForm<QuizFormValues>({
    resolver: zodResolver(quizFormSchema),
    defaultValues: defaultQuizFormValues,
    mode: 'onSubmit',
    reValidateMode: 'onChange',
  });

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = methods;

  const { fields, append, remove } = useFieldArray({ control, name: 'questions' });
  const questionsError = errors.questions?.root?.message ?? errors.questions?.message;

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
        <div className="card p-4 sm:p-5">
          <label htmlFor="quiz-title" className="label">
            Quiz title
          </label>
          <input
            id="quiz-title"
            className={`input text-base ${errors.title ? 'input-error' : ''}`}
            placeholder="e.g. JavaScript Fundamentals"
            autoFocus
            {...register('title')}
          />
          {errors.title && <p className="field-error">{errors.title.message}</p>}
        </div>

        <div className="space-y-4">
          {fields.map((field, index) => (
            <QuestionEditor
              key={field.id}
              index={index}
              canRemove={fields.length > 1}
              onRemove={() => remove(index)}
            />
          ))}
          {questionsError && <p className="field-error">{questionsError}</p>}
        </div>

        <button
          type="button"
          onClick={() => append(createEmptyQuestion())}
          className="btn w-full border-2 border-dashed border-slate-300 py-3 text-slate-600 hover:border-indigo-400 hover:text-indigo-600"
        >
          <PlusIcon /> Add question
        </button>

        {submitError && (
          <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            {submitError}
          </p>
        )}

        <div className="flex justify-end">
          <button type="submit" disabled={isSubmitting} className="btn-primary w-full sm:w-auto">
            {isSubmitting ? 'Saving…' : 'Create quiz'}
          </button>
        </div>
      </form>
    </FormProvider>
  );
}
