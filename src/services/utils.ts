import moment from "moment";

export class Utils {
  public formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  }

  public getMonthsUntilNow(): string[] {
    return [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
  }

  public formatDate(date: string): string {
    return moment(date).format('DD/MM/YYYY');
  }

  public getRangeDate(dateInit: string, dateEnd: string) {
    return moment(dateEnd).diff(moment(dateInit), 'days');
  }

  public getDaysInMonth(month: number, year: number) {
    const daysInMonth = moment(`${year}-${month}`, 'YYYY-MM').daysInMonth();
    const daysArray = [];

    for (let day = 1; day <= daysInMonth; day++) {
      daysArray.push({
        label: moment(`${year}-${month}-${day}`, 'YYYY-MM-DD').format('DD/MM'),
        value: day
      });
    }

    return daysArray;
  }
}
