import { useEffect, useRef, useState } from 'react';
import Icon from './Icon';

type Props = {
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
  ariaLabel: string;
  className?: string;
};

export function SelectMenu({ value, options, onChange, ariaLabel, className = '' }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const close = (event: MouseEvent) => { if (!ref.current?.contains(event.target as Node)) setOpen(false); };
    window.addEventListener('mousedown', close);
    return () => window.removeEventListener('mousedown', close);
  }, []);
  return <div ref={ref} className={`select-menu ${className}`}>
    <button type="button" className="select-menu-trigger" onClick={() => setOpen(actual => !actual)} aria-label={ariaLabel} aria-expanded={open} aria-haspopup="listbox"><span>{value}</span><Icon name="chevronDown" size={17}/></button>
    {open && <div className="select-menu-options" role="listbox" aria-label={ariaLabel}>{options.map(option => <button type="button" role="option" aria-selected={option === value} className={option === value ? 'activo' : ''} key={option} onClick={() => { onChange(option); setOpen(false); }}><span>{option}</span>{option === value && <Icon name="check" size={16}/>}</button>)}</div>}
  </div>;
}
